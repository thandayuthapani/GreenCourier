/*
    Connections Includes... Setting them up for info processing
*/
const minioClient = require("../connections/legacyminio");
//const sqlClient = require("../connections/mysql");

/*
    Models Includes -> Define how access SQL info
*/
const users = require("../models/UsersModel");
const faas = require('../models/FaasModel');

// Misc Includes
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sequelize = require("sequelize");
const fs = require('fs').promises;
const fsc =  require('fs');

/*
    Controller Includes
*/
const baseController = require("./BaseController");
const { responseError, genericResponse, consoleLog } = require("../utils/express_utils");
const FaaSActions = require("../models/FaasModel");
const util = require('util');
const exec = util.promisify(require("child_process").exec);
const { stderr, stdout } = require("process");
const { response } = require("express");
// const { timeStamp, group } = require("console");

const { rootRoles, userRoles } = require('../connections/common')

// Definitions
const sqlOp = sequelize.Op;

const container = require('@google-cloud/container');
const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
const yaml = require('js-yaml');
const axios = require('axios');

// Create the Cluster Manager Client
//Have to specify key path relative to app.js
const containerClient = new container.v1.ClusterManagerClient({
  keyFilename: ".keys/application_default_credentials.json"
});

let clusterInfo = '';
let accessToken = '';
let objsApi = '';

var p0 = new Promise((resolve, reject) => {
  containerClient.getCluster({name: 'projects/carbon-aware-scheduling/locations/europe-central2-a/clusters/cluster-5'}).then(results => {
      clusterInfo = results;
      resolve();
  })
  .catch(err => {
      console.error("ERROR:", err);
      reject();
  })
});


var p1 = new Promise((resolve, reject) => {
  containerClient.auth.getAccessToken().then(results => {
      accessToken = results;
      resolve();
  })
  .catch(err => {
      console.error("ERROR:", err);
      reject();
  })
});

Promise.all([p0, p1]).then(() => {
    const clusterName = clusterInfo[0].name;
    const masterAuth = clusterInfo[0].masterAuth;
    const cluster = {
        name: clusterName,
        caData:masterAuth?.clusterCaCertificate,
        server: `https://${clusterInfo[0].endpoint}`,
        skipTLSVerify: true
    };

    const user = {
        name: 'mohak_chadha08-gsa',
        authProvider: {
            name: 'gcp'
    }};

    console.log(cluster);
    console.log(user);
    kc.loadFromClusterAndUser(cluster, user);
    objsApi = kc.makeApiClient(k8s.CustomObjectsApi);
    objsApi.setDefaultAuthentication({
      applyToRequest: (opts) => {
          opts.ca = Buffer.from(masterAuth.clusterCaCertificate, 'base64');
          opts.headers.Authorization = 'Bearer ' + accessToken;
          }      
    });
})


function get_knative_function_specification(function_name, image_name, function_memory) {
  
  let data = {
    apiVersion: 'serving.knative.dev/v1',
    kind: 'Service',
    metadata: {
        name: `${function_name}`,
        namespace: 'liqo-demo'
    },
    spec: {
        template: {
            metadata: {
                annotations: {
                    'autoscaling.knative.dev/class': 'kpa.autoscaling.knative.dev',
                    'autoscaling.knative.dev/scale-to-zero-pod-retention-period': '5m',
                    'autoscaling.knative.dev/metric': 'concurrency',
                    'autoscaling.knative.dev/target': '1'
                }
            },
            spec: {
                'schedulerName': 'kube-carbon-scheduler',
                containers: [
                    {
                        'image': `${image_name}`,
                        'resources': {
                            requests: {
                                'memory': `${function_memory}`,
                            },
                            limits: {
                                'memory': `${function_memory}`,
                            }
                        },
                        'ports': [
                            {
                                'name': 'h2c',
                                'containerPort': 50051
                            }
                        ]
                    }
                ]
    
            }
        },
    }
  };
  return data
}

// TODO: change the base controller to support async functions
const controller = new (class extends baseController {
  constructor() {
    super(faas);
    this.findAllOptions = {};
  }

  checkFaaS(faasData){
    return new Promise(async (resolve, reject) => {
      // let minioExist = true;
      // let owExist = true;
      // let bucketName = 'func-' + faasData.userId + '-action-' + faasData.name.toLowerCase().replace(' ','-') + '-' + faasData.id;
      // let fileName = bucketName + '.py';
      // let wskCmd = "";
      // let minioObject = null;
      let invokeURL = "";
      // try{
      //   minioObject = await minioClient.getObject(bucketName, fileName);
      // }catch(err){
      //   console.error('Cannot get object', err);
      //   minioExist = false;
      // }

      // try{
      //   wskCmd = `wsk action get ${bucketName} --url -i`;
      //   let {stdout, stderr} = await exec(wskCmd);
      //   if(stderr.includes('error:')){
      //     owExist = false;
      //   }
      //   if(stdout.includes('ok')){
      //     // consoleLog('FaasController', 'checkFaaS', 'wsk action get --url',   stdout.split('\n')[1]);
      //     invokeURL = stdout.split('\n')[1];
      //   }
      // }catch(err){
      //   console.error('Searching the wsk action failed',err);
      //   owExist = false;
      // }
      // objsApi.getNamespacedCustomObject(group='serving.knative.dev', version='v1', namespace='default', plural='services', name=faasData.name).then(
      //   (response) => {
      //       console.log("The deployment exists");
      //       console.log(response);
      //       let returnObj = {
      //         user: {
      //           name: faasData.user.name
      //         },
      //         name: faasData.name,
      //         memory_config: faasData.memory_config,
      //         id: faasData.id,
      //         docker_image: faasData.docker_image,
      //         invoke_url: invokeURL
      //       };
      //       return resolve(returnObj);
      //   }
      // )
      // .catch ((err) => {
      //   console.log("The depoloyment does not exist");
      //       faas.destroy({
      //             where: {id: {[sqlOp.eq]: faasData.id}}
      //           }).then((response)=> {
      //             console.log(`FaaS with no reference [${faasData.name}] deleted...`);
      //             return reject({message: 'FaaS404Reference'});
      //           })
      //           .catch(err => {
      //             return reject({message: 'FaaSDeleteNotAvail'});
      //           });
      // }
      let count = 0;
      let maxTries=5;
      while(true){
        try {
          let customobject = await objsApi.getNamespacedCustomObject('serving.knative.dev', 'v1', 'liqo-demo', 'services', faasData.name);
          let metriccollector_response = await axios.get("http://34.116.186.167:8080/getemission")
          // consoleLog
          console.log("The deployment exists");
          console.log(customobject);
          //We know the function will be deployed in the West US region due to the implementation of GreenCourier and the setup of our demo clusters
          let returnObj = {
                user: {
                  name: faasData.user.name
                },
                name: faasData.name,
                memory_config: faasData.memory_config,
                id: faasData.id,
                docker_image: faasData.docker_image,
                region: "West US",
                score: String(metriccollector_response.data["westus"]) + "%"
          };
          return resolve(returnObj);
        } catch (err) {
          if(++count == maxTries) {
            console.log(err)
            console.log("The depoloyment does not exist");
            console.log(faasData.name);
            try {
              // await faas.destroy({
              //   where: {id: {[sqlOp.eq]: faasData.id}}
              // });
              console.log(`FaaS with no reference [${faasData.name}] deleted...`);
              return reject({message: 'FaaS404Reference'});  
            } catch(err) {
              return reject({message: 'FaaSDeleteNotAvail'});
            }
          }
        }
     
      } 
    });
  }

  async getAll(req, res){
    try{
      this.findAllOptions = (rootRoles.includes(req.authenticated_as.role)) ? {
                              include: [{
                                model: users
                              }]
                              }
                            : {
                              where: {
                                userId: {
                                  [sqlOp.eq]: req.authenticated_as.id
                                }
                              },
                              include: [{
                                model: users
                              }]
                            }

      let faasDatas = await faas.findAll(this.findAllOptions);
      if(faasDatas){
        let promises = [];
        faasDatas.forEach(faasData => {
          promises.push(this.checkFaaS(faasData));
        });

        let results = await Promise.allSettled(promises);
        let passed = [];
        let failed = [];
        results.forEach(result => {
          if(result.status.localeCompare('fulfilled') === 0){
            passed.push(result.value);
          }else if(result.status.localeCompare('rejected') === 0){
            failed.push(result.reason);
          }
        });
        return res.status(200).json({result: passed, errors: failed});
      }else{
        return res.status(200).end();
      }
    }catch(err){
      return responseError(res, err);
    }
  }

  async get(req, res) {
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role)) ?
                          {where: {id: {[sqlOp.eq]: req.params.function_id}}} :
                          {
                            where: {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id:{[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData){
        // let bucketName = 'func-' + faasData.userId + '-action-' + faasData.name.toLowerCase().replace(' ','-') + '-' + faasData.id;
        // let fileName = bucketName + '.py';
        // let filePath = `/tmp/${fileName}`;
        // await minioClient.fGetObject(bucketName, fileName, filePath);
        // let buffer = await fs.readFile(filePath, 'utf8');
        let response = {
          name: faasData.name,
          memory_config: faasData.memory_config,
          docker_image: faasData.docker_image,
        };

        return res.status(200).json({result: response});
      }else{
        return res.status(404).json({name: 'FaaS404', errors:[{message: 'FaaS Not Found'}]});
      }
    }catch(err){
      return responseError(res, err);
    }
  }

  checkInput(nameInp, memoryConfigInp, dockerInp, timeoutInp){
    return new Promise(async (resolve, reject) => {
      const inputExp = /^(?!(-|:|;|&)+)(?!.*--)[(-_+)A-Za-z0-9]+(?<!(-|:|;|&)+)$/g;
      const mem_options = ["512M", "1024M"];
      let nameMatch = true;
      let memMatch = true;
      let dockerMatch = true;
      let timeoutMatch = true;
      try{
        if(nameInp.match(inputExp) === null){
          nameMatch = false;
        }
        if(dockerInp.match(inputExp) === null){
          dockerMatch = false;
        }
        if(timeoutInp === undefined || timeoutInp === null){
          timeoutMatch = false;
        }
        if(!mem_options.includes(memoryConfigInp)){
          memMatch = false;
        }
        return resolve({
          name: nameMatch,
          memoryConfig: memMatch,
          docker: dockerMatch,
          timeout: timeoutMatch
        });
      }catch(err){
        reject(err);
      }
    });
  }

  removeFaaSBucket(faasId, bucketName, fileName=null){
    return new Promise(async (resolve, reject) =>{
      if(fileName){
        try{
          await minioClient.removeObject(bucketName, fileName);
        }catch(err){
          reject(err);
        }
      }
      try{
        await minioClient.removeBucket(bucketName);
        await faas.destroy({where: {id: {[sqlOp.eq]: faasId}}})
        return resolve();
      }catch(err){
        reject(err);
      }
    })
  }

  async add(req, res){
    if(req.authenticated_as.id === -1){
      return res.status(400).json({name: 'OpNotPermited', errors:[{message: 'Root user cannot create FaaS Functios'}]});
    }
    let faasData = null;
    try{
      let {name, memoryConfig, docker} = await this.checkInput(
                                                                req.body.name,
                                                                req.body.memory_config,
                                                                req.body.docker_image,
                                                              );
      
      if(!name || !memoryConfig || !docker) {
        return responseError(res, {name: 'inputError', errors:[{message: 'Your input is incorrect'}]});
      }

      let dockerVerifyCmd = `docker manifest inspect ${req.body.docker_image}`;
      let {stdout, stderr} = await exec(dockerVerifyCmd);
      
      console.dir(stderr);
      if(stderr !== ''){
        return res.status(404).json({name: 'DockerImage404', errors: [{message: `Docker Image ${req.body.docker_image} does not exist`}]});
      }
      console.log(`[FaasController]:[256] Docker Manifest for User=[${req.authenticated_as.id}] passed!`);
      faasData = await faas.create({
                                        name: req.body.name,
                                        memory_config: req.body.memory_config,
                                        docker_image: req.body.docker_image,
                                        userId: req.authenticated_as.id,
                                  });
      console.log(`[FaasController]:[264] FaaS Create for User=[${req.authenticated_as.id}] passed!`);
    }catch(err){
      return responseError(res, err)
    }

    // let bucketName = 'func-' + req.authenticated_as.id + '-action-' + faasData.name.toLowerCase().replace(' ','-') + '-' + faasData.id;
    // let fileName = bucketName + '.py';
    // let filePath = '/tmp/' + fileName;

    // try{
    //   await minioClient.makeBucket(bucketName, ' ')
    // }catch(err){
    //   console.log(`[FaasController]:[276] MinIO makeBucket for User=[${req.authenticated_as.id}] failed!`);
    //   try{
    //     await faas.destroy({where: {id: {[sqlOp.eq]: faasData.id}}})
    //   }catch(err){
    //     return responseError(res, err);
    //   }
    // }
    // console.log(`[FaasController]:[282] MinIO makeBucket for User=[${req.authenticated_as.id}] passed!`);
    // try{
    //   await minioClient.putObject(bucketName, fileName, req.body.code);
    // }catch(err){
    //   console.log(`[FaasController]:[286] MinIO putObject for User=[${req.authenticated_as.id}] failed!`);
    //   console.error(err);
    //   try{
    //     await this.removeFaaSBucket(faasData.id, bucketName);
    //   }catch(err){
    //     return responseError(res, err);
    //   }
    //   return responseError(res, err);
    // }
    // console.log(`[FaasController]:[295] MinIO putObject for User=[${req.authenticated_as.id}] passed!`);
    // try{
    //   await fs.writeFile(filePath, req.body.code, {flag: 'w+'});
    // }catch(err){
    //   console.log(`[FaasController]:[299] Writing into file for User=[${req.authenticated_as.id}] failed!`);
    //   console.error(err);
    //   try{
    //     await this.removeFaaSBucket(faasData.id, bucketName, fileName);
    //   }catch(err){
    //     return responseError(res, err);
    //   }
    //   return responseError(res, err);
    // }
    // console.log(`[FaasController]:[308] Writing into file for User=[${req.authenticated_as.id}] passed!`);

    // let wskCmd = `wsk action update ${bucketName} ${filePath} --docker ${req.body.docker_image}` +
    //               ` --memory ${req.body.memory_config} --timeout ${req.body.timeout} --web raw -i`;

    //Create Knative function
    let data = get_knative_function_specification(req.body.name, req.body.docker_image, req.body.memory_config);
    const deployment = k8s.loadYaml(JSON.stringify(data));
    console.log(deployment);
    // objsApi.getNamespacedCustomObject()
    objsApi.getNamespacedCustomObject('serving.knative.dev', 'v1', 'liqo-demo', 'services', req.body.name).then(
      (response) => {
          console.log("The deployment exists");
          // console.log(response);
          return responseError(res, "This function already exists");
      }
    )
    .catch( (error) => {
        console.log("The deployment does not exist");
        console.log(error);
        objsApi.createNamespacedCustomObject('serving.knative.dev', 'v1', 'liqo-demo', 'services', deployment).then(
            (response) => {
                // console.log(response);
                console.log("Created deployment");
                return res.status(200).end();;
            }
        )
        .catch(error => responseError(res, error));
    });


    // try{
    //   let {stdout, stderr} = await exec(wskCmd);
    //   if(stderr.includes('error:')){
    //     console.log(`[FaasController]:[315] wsk action update for User=[${req.authenticated_as.id}] failed!`);
    //     return responseError(res, {name: 'wskActionFailed', errors:[{message: stderr.split(' ',1)[1]}]});
    //   }else if(stdout.includes('ok:')){
    //     console.log(`[FaasController]:[318] wsk action update for User=[${req.authenticated_as.id}] passed!`);
    //     return res.status(200).end();
    //   }
    // }catch(err){
    //   try{
    //     await this.removeFaaSBucket(faasData.id, bucketName, fileName);
    //   }catch(err){
    //     return responseError(res, err);
    //   }
    //   return responseError(res, err);
    // }
  }

  async edit(req, res){
    if(!req.body.code)
    {
      consoleLog('FaasController', 'edit', 'req.body.code', `Empty Code is not accepted!!!`);
      return genericResponse(res, 'emptyCodeInvalid', 'Empty Code is not accepted', 403);
    }
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role) ) ?
                          {
                            where : {
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          }:{
                            where : {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData)
      {
        let result = {};
        if(req.body.name && faasData.name.localeCompare(req.body.name) !== 0 && req.body.name.length > 0)
        {
          consoleLog('FaasController', 'edit', req.body.name, `Verifying new values for ${faasData.name} -> ${req.body.name}`);
          result = await this.checkInput(req.body.name.toLowerCase(), req.body.memory_config, req.body.docker_image, req.body.timeout);
        }else if(req.body.name && faasData.name.localeCompare(req.body.name) === 0){
          consoleLog('FaasController', 'edit', faasData.name, `Verifying new values for ${faasData.name}`);
          result = await this.checkInput(faasData.name.toLowerCase(), req.body.memory_config, req.body.docker_image, req.body.timeout);
        }else{
          consoleLog('FaasController', 'edit', 'FaaS Name', `New FaaS Name cannot be empty`);
          return genericResponse(res, 'faasNameEmpty', 'New FaaS Name cannot be empty', 403);
        }

        let bucketOldName = `func-${faasData.userId}-action-${faasData.name.toLowerCase()}-${faasData.id}`;
        let fileOldName = `${bucketOldName}.py`;

        let oldBucketExists = await minioClient.bucketExists(bucketOldName);
        if(oldBucketExists)
        {
          consoleLog('FaasController', 'edit', 'bucketExists', `The bucket ${bucketOldName} exists!!!`);
          
          await minioClient.getObject(bucketOldName, fileOldName);
          await minioClient.removeObject(bucketOldName, fileOldName);
          await minioClient.removeBucket(bucketOldName);
          let deleteOldAction = `wsk action delete ${bucketOldName} -i`;
          let stdouts = await exec(deleteOldAction);
          if(stdouts.stderr || !stdouts.stdout.includes('ok:'))
          {
            consoleLog('FaasController', 'edit', 'wsk delete', `Failed to delete the wsk action for ${bucketOldName}!!!`);
            return genericResponse(res, 'wskDeleteFailed', 'Failed to delete the wsk Action');
          }
          consoleLog('FaasController', 'edit', 'minioClient', `Old Bucket has been erased!!!`);

          let bucketNewName = `func-${faasData.userId}-action-${req.body.name.toLowerCase()}-${faasData.id}`;
          let fileNewName = `${bucketNewName}.py`;
          let fileNewPath = `/tmp/${fileNewName}`;
          let wskNewAction = `wsk action update ${bucketNewName} ${fileNewPath} --docker ${req.body.docker_image}` +
          ` --memory ${req.body.memory_config} --timeout ${req.body.timeout} --web raw -i`;

          await minioClient.makeBucket(bucketNewName, ' ');
          await minioClient.putObject(bucketNewName, fileNewName, req.body.code);
          await fs.writeFile(fileNewPath, req.body.code, {flag: 'w+'});

          let wskstdouts = await exec(wskNewAction);
          if(wskstdouts.stderr || !wskstdouts.stdout.includes('ok:'))
          {
            consoleLog('FaasController', 'edit', 'wskAction', `wsk action create for ${bucketNewName} failed!!!`);
            return genericResponse(res, 'failedWskCreate', 'Failed to create Action for your FaaS', 400);
          }
          consoleLog('FaasController', 'edit', 'minioClient + wsk cli', `New Bucket and action for ${bucketNewName} has been created!!!`);
          
          faasData = await faasData.update({
                      name: req.body.name,
                      memory_config: req.body.memory_config,
                      docker_image: req.body.docker_image,
                      timeout: req.body.timeout
                    });
          await faasData.save();
          consoleLog('FaasController', 'edit', 'faasData.update', `FaaS values have been updated!!!`);
          return res.status(200).end();
        }else{
          consoleLog('FaasController', 'edit', 'bucketExists', `The bucket ${bucketOldName} does not exists...`);
        }

      }else{
        consoleLog('FaasController', 'edit', 'faas.findOne', `Could not find requested resource`);
        return genericResponse(res, 'FaaSNotFound', 'FaaS Data could not be retrieved', 404);
      }
    }catch(err){
      return responseError(res, err);
    }
  }

  async invoke(req, res){
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role))?
                          {
                            where: {
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          } : {
                            where : {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData){
        // let bucketName = 'func-' + faasData.userId + '-action-' + faasData.name.toLowerCase().replace(' ','-') + '-' + faasData.id;
        // let wskCmd = `wsk action -i invoke ${bucketName}`;
        let function_url = faasData.name + ".liqo-demo.34.118.93.12.sslip.io";
        let function_name = faasData.name;
        let params = {
          "function_url": function_url,
          "function_name": function_name
        };
        console.log(params);
        // if(req.body.hasOwnProperty('params_fun')){
        //   let params = JSON.parse(req.body.params_fun);
        //   wskCmd = `${wskCmd} --param`
        //   for(var param_index in params){
        //     wskCmd = `${wskCmd} ${param_index} ${params[param_index]}`;
        //   }
        // }

        // let {stdout, stderr} = await exec(wskCmd);
        // if(stderr.includes('error:')){
        //   console.log('wskCmd=%s',wskCmd);
        //   return res.status(400).json({name: 'wskFailed', errors:[{message: 'The exec command failed'}]});
        // }else if(stdout.includes('ok:')){
        //   let wskResult = stdout.split(' ');
        //   faasData = await faasData.update({
        //     activation_id: wskResult[5].replace(/(\r\n|\n|\r)/gm, "")
        //   });

        //   await faasData.save();
        //   console.log(`ActivationId=[${ wskResult[5].replace(/(\r\n|\n|\r)/gm, "")}]`);
        //   return res.status(200).end();
        // }
        axios.post("http://grpcclientserver:5000", params).then(
          (response) =>{
              console.log(response.data);
              faasData.update({
                    activation_id: response.data
              }).then((response) => {
                console.log(response)
                return res.status(200).end();
              }).catch(err=>{
                console.log(err);
              });
              
          }
        ).catch(err=>{
          console.log(err)
          return res.status(400).json({name: 'knativefailed', errors:[{message: 'The post request failed'}]});
        })
      }
    }catch(err){
      return responseError(res, err);
    }

  }

  async results(req, res){
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role))?
                          {
                            where: {
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          } : {
                            where : {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData){
        if(faasData.activation_id){
          return res.status(200)
                        .json({
                          result: [{results: faasData.activation_id, logs: faasData.activation_id
                      }]});
        } 
        else {
            return res.status(404)
            .json({
              name: 'activationIdNull',
              errors:[{
                message: 'The respective action has not been invoked'
              }]
            });
        }
      }else{
        return res.status(404).json({name: 'faasNotFound', errors:[{message: 'The given FaaS Function could not be found'}]});
      }
    }catch(err){
      return responseError(res, err);
    }
  }

  async logs(req, res){
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role))?
                          {
                            where: {
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          } : {
                            where : {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData && faasData.activation_id){
        try{
          // let filePath = `/tmp/${faasData.activation_id}.log`;
          // fsc.access(filePath, fsc.constants.F_OK, err => {
          //   if(!err){
          //     console.log(`Sending file ${filePath}`);
          //     return res.sendFile(filePath);
          //   }else{
          //     console.log(`The result was ${err}`);
          //     return res.status(404).end();
          //   } 
          // });       
          res.status(200)
                        .json({
                          result: [{results: faasData.activation_id, logs: faasData.activation_id
          }]})
        }catch(err){
          return responseError(res, err);
        }
      }
    }catch(err){
      return responseError(res, err)
    }
    // return res.status(200);
  }
  async delete(req, res){
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role))? 
                          {
                            where : {
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          } : {
                            where : {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData){
        this.findAllOptions = {
          where: {
            userId: {[sqlOp.eq]: faasData.userId},
            id: {[sqlOp.eq]: req.params.function_id}
          }
        };
        try {
          let tempresp = await objsApi.deleteNamespacedCustomObject('serving.knative.dev', 'v1', 'liqo-demo', 'services', faasData.name);
          await faas.destroy(this.findAllOptions);
          console.log("Deleted function");
          console.log(tempresp);
          return res.status(200).end();
          
        } catch(err) {
          console.log("Unable to delete function");
          console.log(err);
          return responseError(res, 'Could not delete function');
        }
        
      }else{
        return res.status(404).json({name: 'faas404', errors:[{message: 'FaaS to delete could not be found'}]});
      }
    }catch(err){
      return responseError(res, err);
    }
  }

  async downloadLogs(req, res){
    this.findAllOptions = (rootRoles.includes(req.authenticated_as.role))? 
                          {
                            where : {
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          } : {
                            where : {
                              userId: {[sqlOp.eq]: req.authenticated_as.id},
                              id: {[sqlOp.eq]: req.params.function_id}
                            }
                          };
    try{
      let faasData = await faas.findOne(this.findAllOptions);
      if(faasData && faasData.activation_id){
        // let filePath = `/tmp/${faasData.activation_id}.log`;
        //   fsc.access(filePath, fsc.constants.F_OK, err => {
        //     if(!err){
        //       return res.download(filePath);
        //     }else{
        //       return responseError(res, err);
        //     }
        //   });
        res.status(200)
                        .json({
                          result: [{results: faasData.activation_id, logs: faasData.activation_id
                      }]})
      }
    }catch(err){
      return responseError(res, err);
    }
  }
})();

module.exports = {
  getAll: controller.getAll.bind(controller),
  add: controller.add.bind(controller),
  invoke: controller.invoke.bind(controller),
  delete: controller.delete.bind(controller),
  get: controller.get.bind(controller),
  edit: controller.edit.bind(controller),
  results: controller.results.bind(controller),
  logs: controller.logs.bind(controller),
  downloadLogs: controller.downloadLogs.bind(controller),
  // signin: controller.signin.bind(controller),
  // self: controller.self.bind(controller),
};