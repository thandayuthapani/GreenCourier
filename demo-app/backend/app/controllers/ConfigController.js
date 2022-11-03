const Config = require('../models/ConfigModel');
const Devices = require('../models/DevicesModel');

const {genericResponse, consoleLog} = require('../utils/express_utils');

const { KafkaClient } = require('../connections/kafka')

const controller = new (class {
  async getSettings(req, res)
  {
    if(req.authenticated_as.id === -1)
    {
      return genericResponse(res, 'configNotAvail', 'This users cannot access this resource', 401);
    }
    consoleLog('ConfigController', 'getSettings', 'user validation', 'Searching for User\'s settings');
    let searchOpts = {
      where: {
        userId: req.authenticated_as.id
      }
    }

    try {
      let response = await Config.findOne(searchOpts);
      if(!response)
      {
        return res.sendStatus(200);
      }

      return res.status(200).json({results: response});

    } catch(err) {
      return genericResponse(res, 'searchSettingsFailed', 'We could not retrieve your settings', 500);
    }
  }

  async settingsCreate(req, res)
  {
    try {
      await Config.create({
        settings_json: req.body.config,
        userId: req.authenticated_as.id
      });

      return res.sendStatus(200);
    } catch(err) {
      return genericResponse(res, 'errCreateSettings', 'We could not create your settings', 500);
    }
  }

  async settingsUpdate(req, res)
  {
    try {
      await Config.update({
        settings_json: req.body.config
      }, {
        where: {
          id: req.query.configId
        }
      });

      return res.sendStatus(200);
    } catch(err) {
      return genericResponse(res, 'errUpdateSettings', 'We could not update your settings', 500);
    }
  }

  async uiUpdateSettings(req, res)
  {
    if(req.authenticated_as.id === -1)
    {
      return genericResponse(res, 'OpNotPermitted', 'You cannot update this resource', 401);
    }

    if(req.query.hasOwnProperty('configId'))
    {
      this.publishAction('update_user_settings_ui', Object.keys(JSON.parse(req.body.config)), req.authenticated_as.id);
      return this.settingsUpdate(req, res);
    }

    this.publishAction('create_user_settings_ui', Object.keys(JSON.parse(req.body.config)), req.authenticated_as.id);
    return this.settingsCreate(req, res)
  }

  async publishAction(action, keys, userId, isDevice = false, deviceId = -1)
  {
    let payload = {
      schema: {
        type: 'struct',
        fields:[
          {
            field: "timestamp",
            type: "int64",
            optional: false
          },
          {
            field: "operation",
            type: "string",
            optional: false
          },
          {
            field: "deviceId",
            type: "int64",
            optional: true
          },
          {
            field: "keys",
            type: "array",
            optional: true,
            items: {
              type: "string",
              optional: true
            }
          }
        ],
        name: action,
        optional: false
      },
      payload: {
        timestamp: (new Date()).valueOf(),
        operation: action,
        keys: keys,
        ...isDevice &&  {deviceId: deviceId},
        mqtt_gateway: 'iotcore'
      }
    }

    let send_payload = [{
      value: JSON.stringify(payload)
    }];

    try {
      await KafkaClient.getInstance().forwardToKafka(`${userId}_settings`, send_payload);
    } catch(err) {
      consoleLog('ConfigController', 'publishAction', 'ErrorFrwdMessage', 'We could not publish the message to Kafka')
    }
  }

  /**
   * 
   * @param {*} req 
   * @param {*} res 
   * @param { string[] } keys 
   * @param { Config | Devices } model 
   * @param { boolean } isDevice 
   * @returns 
   */
  async fetchSettings(req, res, keys, model, isDevice = false)
  {
    try {
      let opts = {
        where: {
          ...!isDevice && {userId: req.authenticated_as.id},
          ...isDevice && {id: req.query.deviceId}
        }
      }

      let cfg = await model.findOne(opts);
      let settings = cfg[isDevice ? "device_config" : "settings_json"];
      if(typeof settings !== 'object')
      {
        settings = JSON.parse(cfg[isDevice ? "device_config" : "settings_json"])
      }
      consoleLog('ConfigController', 'updateSettings', 'First JSON parse', typeof settings);
      if(typeof settings === "string")
      {
        settings = JSON.parse(settings)
      }
      
      let x = {};
      consoleLog('ConfigController', 'fetchSettings', 'settings', settings);
      let settings_keys = Object.keys(settings)
      consoleLog('ConfigController', 'fetchSettings', 'keys', settings_keys);
      for(let key of keys)
      {
        consoleLog('ConfigController', 'fetchSettings', 'map keys', key);
        if(settings.hasOwnProperty(key))
        {
          x = {
            [key]: settings[key],
            ...x
          }
        }
      }
      await this.publishAction(isDevice ? "fetch_device_settings_api" : "fetch_user_settings_api", keys, req.authenticated_as.id, isDevice, isDevice ? req.query.deviceId : -1);
      return res.status(200).json(x);
    } catch (err) {
      consoleLog('ConfigController', 'fetchSettings', 'error', err);
      return genericResponse(res, 'globalSettingsFailed', 'Failed to process settings', 500);
    }
  }

  async fetchInfo(req, res)
  {
    if(!req.query.hasOwnProperty('type'))
    {
      return genericResponse(res, 'queryRequiresType', 'You need to specify a query type', 403);
    }

    if(!req.query.hasOwnProperty('keys'))
    {
      return genericResponse(res, 'queryRequiresType', 'You need to specify at least one key', 403);
    }

    let keys = req.query.keys.split(',');
    consoleLog('ConfigController', 'fetchInfo', 'split keys', keys);
    if(req.query.type === 'global')
    {
      return this.fetchSettings(req, res, keys, Config);
    }

    if(!req.query.hasOwnProperty('deviceId'))
    {
      return genericResponse(res, 'queryRequiresDeviceId', 'You need to specify the deviceId parameter', 403);
    }
    return this.fetchSettings(req, res, keys, Devices, true);
  }

  async updateSettings(req, res, model, isDevice = false)
  {
    let opts = {
      where: {
        ...!isDevice && {userId: req.authenticated_as.id},
        ...isDevice && {id: req.query.deviceId}
      }
    };

    try{
      let cfg = await model.findOne(opts);

      let settings = cfg[isDevice ? "device_config" : "settings_json"];
      if(typeof settings !== 'object')
      {
        settings = JSON.parse(cfg[isDevice ? "device_config" : "settings_json"])
      }
      consoleLog('ConfigController', 'updateSettings', 'First JSON parse', typeof settings);
      if(typeof settings === 'string')
      {
        settings = JSON.parse(settings);
      }

      let settings_keys = Object.keys(settings);

      let updated_keys = [];
      for(let key of settings_keys)
      {
        if(req.query.hasOwnProperty(key))
        {
          settings[key] = req.query[key]
          updated_keys.push(key);
        }
      }
      
      let string_settings = JSON.stringify(settings);
      if(typeof string_settings !== 'string')
      {
        string_settings = JSON.stringify(string_settings);
      }
      await cfg.update({
        [isDevice ? "device_config" : "settings_json"]: `${string_settings}`
      });

      await cfg.save();
      this.publishAction(`update_${isDevice ? 'device' : 'user'}_settings_api`, updated_keys, req.authenticated_as.id, isDevice, isDevice ? req.query.deviceId : -1);
      return res.sendStatus(200);
    } catch(err) {
      consoleLog('ConfigController', 'updateSettings', 'Error catch', console.dir(err))
      return genericResponse(res, 'failedToUpdateSettings', 'Failed to update settings', 500);
    }
  }

  async apiUpdateSettings(req, res)
  {
    if(req.authenticated_as.id === -1)
    {
      return genericResponse(res, 'errUserUnauthorized', 'You cannot update this resource', 401);
    }

    if(req.query.type === 'global')
    {
      return this.updateSettings(req, res, Config);
    }

    if(!req.query.hasOwnProperty('deviceId'))
    {
      return genericResponse(res, 'noDeviceIdGiven', 'This resource is only reachable with a device ID');
    }
    return this.updateSettings(req, res, Devices, true);
  }
})();

module.exports = {
  get: controller.getSettings.bind(controller),
  uiUpdate: controller.uiUpdateSettings.bind(controller),
  fetch: controller.fetchInfo.bind(controller),
  apiUpdate: controller.apiUpdateSettings.bind(controller)
}