/*
  Connection Includes...
*/
const minioClient = require('../connections/legacyminio');

/*
  Model includes
*/
const OTA = require('../models/OTAModel');
const Devices = require('../models/DevicesModel');
const DeviceOTA = require('../models/DeviceOTA');

/**
 * Misc Includes
 */
const {rootRoles, espSupport} = require("../connections/common");
const {genericResponse, consoleLog} = require("../utils/express_utils");
const fs = require('fs');
const fsp = require('fs').promises;
const sequelize = require('sequelize');
const path = require('path')

/**
 * Global variable definition
 */
const Op = sequelize.Op;

const controller = new (class {
  async get(req, res)
  {
    if(rootRoles.includes(req.authenticated_as.role) && req.authenticated_as.id === -1)
    {
      return genericResponse(res, "opNotPermitted", "Default Root User cannot access this resource", 403);
    }
    
    let otaValues = [];

    let searchOpts = {
      where: { 
        userId: req.authenticated_as.id
      }
    }

    let userDevices = await Devices.findAll(searchOpts);

    for(let index = 0; index < userDevices.length; ++index) {
      searchOpts = {
        where: {
          devToOta: userDevices[index].id
        }
      }

      let devOtasValues = [];
      let deviceOtas = await DeviceOTA.findAll(searchOpts);
      for(let j = 0; j < deviceOtas.length; ++j) {
        searchOpts = {
          where: {
            id: deviceOtas[j].otaToDev
          }
        }
        let ota = await OTA.findOne(searchOpts);
        devOtasValues.push(ota);
      }
      let newObject = {
        device_id: userDevices[index].id,
        device_name: userDevices[index].name,
        otas: devOtasValues
      }
      otaValues.push(newObject);
    }

    if(otaValues.length === 0)
    {
      consoleLog("OTAController", "get", "fs.existsSync", "The user does not have OTA Updates");
      return res.status(200).json({result: [], devices: {}});
    }

    return res.status(200).json({result: otaValues, devices: userDevices});
  }

  async upload(req, res)
  {
    if(req.authenticated_as.id === -1)
    {
      return genericResponse(res, "opNotPermitted", "Default Root User cannot access this resource", 403);
    }

    let bucketName = `ota-${req.authenticated_as.username}`;

    let files = req.files;
    let file;
    if(!files || (files?.length || 0) !== 1)
    {
      return genericResponse(res, "onlyOneOpPermitted", "The server was expecting only one file", 400);
    } else {
      file = files[0];
    }

    const {name, filename, filesize, changes, associatedDevices, date} = req.body;
    
    let devicesToSave = JSON.parse(associatedDevices);

    let fileName = '';

    if(name.length > 0)
    {
      fileName = name.includes('.bin') ? name : `${name}.bin`;
    } else {
      fileName = `${date}-${filename}`;
    }

    try{
      let exists = await minioClient.bucketExists(bucketName);
      if(!exists) {
        consoleLog("OTAController", "upload", "Create bucket", `Creating bucket for ${req.authenticated_as.username}...`);
        await minioClient.makeBucket(bucketName, ' ');
        consoleLog("OTAController", "upload", "Create bucket", `Bucket created for ${req.authenticated_as.username}!`);
      }

      let objStream = minioClient.listObjects(bucketName, '', true);
      let objects = [];
      objStream.on('data', obj => {
        objects.push(obj.name);
      });

      /**
       * TODO:  add error catching for the inside async block
       *        add a for loop for the passed devices and ensure the front end sends devices!
       */

      await new Promise(fulfill => objStream.on('end', fulfill));

      for(var i = 0; i < devicesToSave.length; ++i) {
        const latestFileName = `latest-${devicesToSave[i].device_id}.bin`;

        if(objects.length > 0 && objects.includes(latestFileName)) {
          consoleLog("OTAController", "upload", "Write to Minio", `Removing old latest.bin...`);
          await minioClient.removeObject(bucketName, latestFileName);
          await DeviceOTA.destroy({
            where:{
              otaName: latestFileName
            }
          });
          await OTA.destroy({
            where: {
              filename: latestFileName,
              userId: req.authenticated_as.id
            }
          });
        }

        let appVersion = file.buffer.toString('utf-8', 48, 80).split('\0')[0];
        let espIDFVersion = file.buffer.toString('utf-8', 144, 172).split('\0')[0];
        consoleLog("OTAController", "upload", "Write to Minio", `Writing ${fileName} and ${latestFileName} for ${appVersion} (${espIDFVersion})...`);

        await minioClient.putObject(bucketName, fileName, file.buffer);
        await minioClient.putObject(bucketName, latestFileName, file.buffer);
        consoleLog("OTAController", "upload", "Write to Minio", `Objects were written!`);

        let otaData = await OTA.create({
          filename: fileName,
          date: date,
          size: parseInt(filesize),
          firmVersion: appVersion,
          changes: changes,
          espIDFVer: espIDFVersion,
          userId: req.authenticated_as.id
        });

        await DeviceOTA.create({
          otaName: fileName,
          otaToDev: otaData.id,
          devToOta: devicesToSave[i].device_id
        })

        otaData = await OTA.create({
          filename: latestFileName,
          date: date,
          size: parseInt(filesize),
          firmVersion: appVersion,
          changes: changes,
          espIDFVer: espIDFVersion,
          userId: req.authenticated_as.id
        });

        await DeviceOTA.create({
          otaName: latestFileName,
          otaToDev: otaData.id,
          devToOta: devicesToSave[i].device_id
        });
      }
      return res.status(200).end();
    } catch(err) {
      if(err.hasOwnProperty("statusCode")) {
        return genericResponse(res, 'minioError', err.message, err.statusCode);
      } else {
        return genericResponse(res, 'minioError', err.message, 500);
      }
    }

    
  }

  async download(req, res)
  {
    try {
      let searchOpts = {
        where: {
          userId: req.authenticated_as.id
        }
      }
      let otaData = await OTA.findOne(searchOpts);
      if(!otaData) {
        consoleLog('OTAController', 'download', 'OTA.findOne', 'We did not find OTA files associated with this user');
        return genericResponse(res, 'otaNotFound', 'OTA File for you was not found', 404);
      }
      let bucketName = `ota-${req.authenticated_as.username}`;
      searchOpts = {
        where: {
          otaToDev: req.params.otaId
        }
      }
      otaData = await DeviceOTA.findOne(searchOpts);
      var options = {
        root: path.join(__dirname, 'download')
      };
      await minioClient.fGetObject(bucketName, otaData.otaName, `${options.root}/${otaData.otaName}`);
      return res.download(`${options.root}/${otaData.otaName}`);
      return res.sendFile(otaData.otaName, options, (err) => {
        if(err) {
          consoleLog('OTAController', 'download', 'sendFile', err);
        } else {
          consoleLog('OTAController', 'download', 'sendFile', `The firmware ${otaData.otaName} was sent`);
        }
        fs.unlinkSync(`${options.root}/${otaData.otaName}`);
      });
    } catch(err) {
      console.dir(err);
      return genericResponse(res, 'downloadFileFailed', 'The server failed to send a file', 500);
    }
  }

  async downloadBin(req, res)
  {
    if(req.authenticated_as.id === -1)
    {
      return genericResponse(res, 'userNotAllowed', 'This user is not allowed to download files', 403);
    }

    if(!req.hasOwnProperty('authenticated_device')) {
      consoleLog('OTAController', 'downloadBin', 'Device ID on Token', 'The token did not produce the correct device');
      return genericResponse(res, 'deviceNotAllowed', 'Verify your token! This endpoint only admits devices', 403);
    }

    let firmwareName = req.params.firmware === 'latest.bin' ? `latest-${req.authenticated_device}.bin` : req.params.firmware;

    let searchOpts = {
      where: {
        otaName: firmwareName,
        devToOta: req.authenticated_device
      }
    }

    try {
      let otaData = await DeviceOTA.findOne(searchOpts);
      if(!otaData)
      {
        consoleLog('OTAController', 'downloadBin', 'OTA.findOne', 'There is no OTA file');
        return genericResponse(res, 'otaNotFound', 'You have no OTA files', 404);
      }
      
      searchOpts = {
        where: {
          userId: req.authenticated_as.id,
          filename: firmwareName,
          id: otaData.otaToDev
        }
      }

      otaData = await OTA.findOne(searchOpts);
      if(parseInt(otaData.firmVersion) <= parseInt(req.params.app_version))
      {
        consoleLog('OTAController', 'downloadBin', 'version compare', 'You are in the newest version');
        return genericResponse(res, 'serverOldOTA', 'You are in the newest version', 404);
      }

      let bucketName = `ota-${req.authenticated_as.username}`;
      let streamObj = minioClient.listObjects(bucketName, '', true);
      let objects = [];
      streamObj.on('data', obj => {
        objects.push(obj.name);
      });

      await new Promise(fulfill => streamObj.on('end', fulfill));

      if(objects.length > 0 && objects.includes(firmwareName)) {
        try {
          let today = new Date().toISOString();
          let filePath = `latest-${req.authenticated_as.username}-${today}.bin`;
          var options = {
            root: path.join(__dirname)
          };
          await minioClient.fGetObject(bucketName, firmwareName, `${options.root}/${filePath}`);
          return res.sendFile(filePath, options, (err) => {
            if(err) {
              consoleLog('OTAController', 'downloadBin', 'sendFile', err);
            } else {
              consoleLog('OTAController', 'downloadBin', 'sendFile', `The firmware ${firmwareName} was sent`);
            }
            fs.unlinkSync(`${options.root}/${filePath}`);
          });
        } catch(err) {
          consoleLog('OTAController', 'downloadBin', 'streamOn => end', err);
          return genericResponse(res, 'sendFileError', err, 500);
        }
      } else {
        consoleLog('OTAController', 'downloadBin', 'Check if firmware exists', `The firmware (${firmwareName}) does not exists in Minio`);
        await OTA.destroy(findOpts);
        consoleLog('OTAController', 'downloadBin', 'Delete from MariaDB', `The firmware (${firmwareName}) has been removed from MariaDB`);
        return res.sendStatus(404);
      }

    } catch (err) {
      return genericResponse(res, 'undefinedErr', 'Something went wrong', 500);
    }

  }

  async checkVersion(req, res)
  {
    /**
     * This is version check for the latest binary to see if the device should
     * update. This is intended to reduce overhead from the IoT device since 
     * it is more efficient to check on the server than on the device.
     * 
     * It returns 200 when it should download or 401 when the remote version
     * (IoT device) is higher than the local one (server).
     */
    if(req.authenticated_as.id === -1)
    {
      return genericResponse(res, "opNotPermitted", "Your user does not have access to this resource", 403);
    }
    
    let fileDir = `/data/${req.authenticated_as.username}`;
    let binaryFileName = `${fileDir}/latest.bin`;
    let verSize = 32;
    let ver = Buffer.alloc(verSize);
    let espVer = Buffer.alloc(verSize)
    fs.open(binaryFileName, "r", (status, fd) => {
      if(status)
      {
        consoleLog("OTAController", "checkVersion", "fs.open", status.message);
        return genericResponse(res, "openFileFailed", status.message, 401);
      }
      /**
       * Read the binary file after 48 bytes given the structure of the 
       * expected binary file. For the moment, only ESP-IDF >= v4.0 binaries are
       * supported.
       * 
       * @warning This feature 
       * 
       * For more info on how the header is build, check this:
       * https://github.com/espressif/esp-idf/blob/145c3cd000107733e24a56c8ed74e5620bebe1ad/components/bootloader_support/include/esp_app_format.h#L110
       */

      // TODO: before this, check if the ESP-IDF version is supported.
      /**
       * Start reading the file at 110 bytes and then read 32 bytes.
       */
      fs.read(fd, ver, 0, 32, 48, (err, num) => {
        if(err)
        {
          consoleLog("OTAController", "checkVersion", "fs.read (Code Version)", err);
          return genericResponse(res, "readBytesFailed", err, 401);
        }
        else
        {
          consoleLog("OTAController", "checkVersion", "fs.read (Code Version)", `Read ${num} bytes from ${binaryFileName}`);
        }
      });

      fs.read(fd, espVer, 0, 32, 160, (err, num) => {
        if(err)
        {
          consoleLog("OTAController", "checkVersion", "fs.read (ESP-IDF Version)", err);
          return genericResponse(res, "readBytesFailed", err, 401);
        }
        else
        {
          consoleLog("OTAController", "checkVersion", "fs.read (ESP-IDF Version)", `Read ${num} bytes from ${binaryFileName}`);
        }
      });

    });

    if(!espSupport.includes(espVer.toString()))
    {
      return genericResponse(res, "espVerNotSupported", "Your ESP-IDF version is not supported. Only ESP-IDF >= v4.0", 403);
    }

    let intVerESP = parseInt(req.body.esp_ver);
    let intVerServer = parseInt(ver);
    if(intVerESP < intVerServer)
    {
      return res.status(200).end();
    }

    return res.status(401).end();
    
  }
})();

module.exports = {
  get: controller.get.bind(controller),
  upload: controller.upload.bind(controller),
  deviceDownload: controller.downloadBin.bind(controller),
  download: controller.download.bind(controller),
}