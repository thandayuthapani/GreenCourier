const connection = require("../connections/mysql");
const {
  responseError,
  genericResponse,
  dashboardResponse,
} = require("../utils/express_utils");
const Users = require("../models/UsersModel");
const Devices = require("../models/DevicesModel");
const Sensors = require("../models/SensorsModel");
const jwt = require("jsonwebtoken");
const {
  AUTHENTICATION_SECRET,
  ROOT_USERNAME,
  ROOT_PASSWORD,
} = require("../secrets");
const bcrypt = require("bcryptjs");
const BaseController = require("./BaseController");
const Sequelize = require("sequelize");
const sqlOp = Sequelize.Op;
const { addTopic, deleteTopic } = require("../connections/kafka");
const { addConnectJob, deleteConnectJob } = require("../connections/connect");

const {
  addElasticsearchIndex,
  deleteElasticsearchIndex,
} = require("../connections/elasticsearch");

const {
  rootRoles,
  userRoles,
  elasticAccess,
  elasticsearchhost,
  kibanaHostname, 
  kibanaPort
} = require('../connections/common');
const axios = require('axios');
const { Config } = require("@kubernetes/client-node");

const controller = new (class extends BaseController {
  constructor() {
    super(Users);
    this.findAllOptions = {};
    // this.findAllOptions = {
    //   exclude: ["password"],
    //   include: [{ model: Devices }],
    // };
  }

  async getAll(req, res)
  {
    if(rootRoles.includes(req.authenticated_as.role))
    {
      this.findAllOptions = {
        exclude: ["password"]
      }
      try{
        let userDatas = await Users.findAll(this.findAllOptions);
        return res.status(200).json({result: userDatas});
      }catch(err){
        return responseError(res, err);
      }
    }
    else if(userRoles.includes(req.authenticated_as.role))
    {

      return res.status(200).json({result: req.authenticated_as})
    }
    else {
      return genericResponse(res, "userUnknownError404", "Unknown User Controller Behavior", 404);
    }

  }

  async createSpace(kibanaURL, data){
    let params = {
      "id": `${data.username}_space`,
      "name": `${data.name}'s Space`,
      "description": `This is ${data.name}'s Space`,
      "color": "#0065bd"
    };

    return axios.post(`${kibanaURL}/api/spaces/space`, params, elasticAccess);
  }

  async createRole(kibanaURL, data){
    let prop = data.username+"_space";
    let params = {
      "elasticsearch": {
        "cluster": ["monitor"],
        "indices": [{
            "names": [`${data.id}_*`],
            "privileges": ["all"]
          }
          ]
      },
      "kibana": [
        {
          "base": [],
          "feature": {
            "discover": ["all"],
            "visualize": ["all"],
            "dashboard": ["all"],
            "dev_tools": ["read"],
            "advancedSettings": ["read"],
            "indexPatterns": ["all"],
            "graph": ["all"],
            "apm": ["read"],
            "maps": ["read"],
            "canvas": ["read"],
            "infrastructure": ["all"],
            "logs": ["all"],
            "uptime": ["all"],
            "ml": ["all"]
          },
          "spaces": [prop]
        }
      ]
    }

    return axios.put(`${kibanaURL}/api/security/role/${data.username}_role`, params, elasticAccess);

  }

  async createUser(elasticURL, data, pass){
    let params = {
      "password": pass,
      "roles": [`${data.username}_role`, "monitoring_user", "watcher_user", "snapshot_user", "machine_learning_user", "showroom_role"],
      "full_name": data.name,
    }

    return axios.post(`${elasticURL}/_security/user/${data.username}`, params, elasticAccess);
  }

  async add(req, res){
    let data = req.body;
    let userPass = data.password;
    try{
      if(data.password){
        let salt = await bcrypt.genSalt(10);
        data.password =  await bcrypt.hash(data.password, salt);
      }
      data = await Users.create(data);
      delete data.password;
      // let kibanaURL = `http://${kibanaHostname}:${kibanaPort}`;
      // let spaceRes = await this.createSpace(kibanaURL, data);
      // if(spaceRes.status === 200){
      //   let roleRes = await this.createRole(kibanaURL, data);
      //   if(roleRes.status === 204){
      //     let userRes = await this.createUser(`http://${elasticsearchhost}`, data, userPass);
      //     userRes = userRes.data;
      //     if(userRes.created){
      //       let result = {	
      //         "transforms.TimestampConverter.type": "org.apache.kafka.connect.transforms.TimestampConverter$Value",
      //         "transforms.TimestampConverter.target.type": "Timestamp",
      //         "transforms.TimestampConverter.field": "timestamp"
      //       }
      //       await addElasticsearchIndex(`${data.id}_settings`);
      //       await addConnectJob(`${data.id}_settings`, result);
      //       return res.status(200).json({ result: data });
      //     }else{
      //       console.error(userRes);
      //       return res.status(400).json({
      //         name: "userCreateError400",
      //         errors: [{
      //           message: "Cannot create user on ElasticSearch"
      //         }]});
      //     }
      //   }else{
      //     console.error(roleRes);
      //     return res.status(400).json({
      //       name: "roleError400",
      //       errors: [{
      //         message: "Cannot create role on Kibana"
      //       }]});
      //   }
      // }else{
      //   console.error(spaceRes);
      //   return res.status(400).json({
      //     name: "spaceError400",
      //     errors: [{
      //       message: "Cannot create Space on Kibana"
      //     }]});
      // }
    }catch(err){
      return responseError(res, err);
    }
  }
  async updateKibanaUser(kibanaUser, kibanaPass, kibanaName){
    let params = {
      "password": kibanaPass,
      "roles": [`${kibanaUser}_role`, "monitoring_user", "watcher_user", "snapshot_user", "machine_learning_user", "showroom_role"],
      "full_name": kibanaName
      
    }
    if(kibanaPass === "")
    {
      delete params.password;
    }

    return axios.post(`http://${elasticsearchhost}/_security/user/${kibanaUser}`, params, elasticAccess);
  }

  async update(req, res){

    if(!rootRoles.includes(req.authenticated_as.role))
    {
      return genericResponse(res, 'userUnauthorized', 'Restricted Access to User Operations', 401);
    }

    this.findAllOptions = {
                            where: {
                              id: {[sqlOp.eq]: req.params.id}
                            }
                          };
    
    try{
      let userData = await Users.findOne(this.findAllOptions);
      if(userData === null || userData === undefined){
        return genericResponse(res, 'emptyResult', 'User could not be updated', 404);
      }

      let newSalt = "";
      let newHash = "";
      let unHashed = "";
      if(req.body.password !== undefined && req.body.password !== null){
        newSalt = await bcrypt.genSalt(10);
        newHash = await bcrypt.hash(req.body.password, newSalt);
        unHashed = req.body.password;
        req.body.password = newHash;
      }
      
      if(newHash === "")
      {
        delete req.body.password
      }
      
      userData = await userData.update(req.body);
      // try {
      //   let updateES = await this.updateKibanaUser(userData.username, unHashed, req.body.name);
      //   if(req.body.hasOwnProperty("password"))
      //   {
      //     delete req.body.password;
      //   }
      //   if(!updateES.created){
      //     await userData.save();
      //     return res.status(200).end();
      //   }
      //   return genericResponse(res, 'userElasticSearchUpdate', 'Update password on ElasticSearch is not possible', 403);
      // }catch(err){
      //   console.dir(err.data.error);
      //   return responseError(res, err)
      // }
    }catch(err){
      return responseError(res, err);
    }
  }

  async kibanaDeleteSpace(username)
  {
    return axios.delete(`http://${kibanaHostname}:${kibanaPort}/api/spaces/space/${username}_space`, elasticAccess);
  }

  async kibanaDeleteRole(username)
  {
    return axios.delete(`http://${kibanaHostname}:${kibanaPort}/api/security/role/${username}_role`, elasticAccess);
  }

  async elasticDeleteUser(username)
  {
    return axios.delete(`http://${elasticsearchhost}/_security/user/${username}`, elasticAccess);
  }

  async delete(req, res)
  {
    if(rootRoles.includes(req.authenticated_as.role))
    {
      this.findAllOptions = {
        exclude: ["password"],
        where: {
          id: {
            [sqlOp.eq]: req.params.id
          }
        }
      };

      try{
        let userData = await Users.findOne(this.findAllOptions);
        if(!userData)
        {
          return genericResponse(res, "userNotFound", "Error when fetching user", 404);
        }
        
        // Fetches device information
        // this.findAllOptions = {
        //   where: {
        //     userId: {
        //       [sqlOp.eq]: userData.id
        //     }
        //   }
        // };
        
        // let userDevices = await Devices.findAll(this.findAllOptions);
        // if(!userDevices)
        // {
        //   return res.status(200).end();
        // }

        // for await (const userDevice of userDevices)
        // {
        //   this.findAllOptions = {
        //     where: {
        //       deviceId: {
        //         [sqlOp.eq]: userDevice.id
        //       }
        //     }
        //   }
        //   let userSensors = await Sensors.findAll(this.findAllOptions);
        //   if(userSensors){
        //     await Sensors.destroy(this.findAllOptions);
        //     for await(const userSensor of userSensors)
        //     {
        //       const topic = `${userData.id}_${userDevice.id}_${userSensor.id}`;
        //       await deleteConnectJob(topic);
        //       await deleteTopic(topic);
        //       await deleteElasticsearchIndex(topic);
        //     }
        //   } 
        // }


        // this.findAllOptions = {
        //   where: {
        //     userId: {
        //       [sqlOp.eq]: req.params.id
        //     }
        //   }
        // }
        // await Devices.destroy(this.findAllOptions);

        this.findAllOptions = {
          where: {
            id: {
              [sqlOp.eq]: req.params.id
            }
          }
        }

        await Users.destroy(this.findAllOptions);

        // let deleteResponse = await this.kibanaDeleteSpace(userData.username);
        // if(deleteResponse.status !== 204){
        //   console.dir(deleteResponse);
        //   return genericResponse(res, "deleteRoleForbidden", "Error when deleting Kibana Role", deleteResponse.status);
        // }

        // deleteResponse = await this.kibanaDeleteRole(userData.username);
        // if(deleteResponse.status !== 204)
        // {
        //   console.dir(deleteResponse);
        //   return genericResponse(res, "deleteSpaceForbidden", "Error when deleting Kibana Space", deleteResponse.status);
        // }

        // deleteResponse = await this.elasticDeleteUser(userData.username);
        // if(deleteResponse.data.hasOwnProperty("found") && !deleteResponse.data.found)
        // {
        //   return genericResponse(res, "deleteUserError", "Could not delete user on ElasticSearch", 403);
        // }

        console.log("Success deleting user");
        return res.status(200).end();
      }catch(err){
        return responseError(res, err);
      }
    }else
    {
      return genericResponse(res, "opNotAllowed", "You have no rights to perform this operation", 403);
    }
  }

  signin(req, res) {
    if (
      req.body.username &&
      req.body.password &&
      req.body.username === ROOT_USERNAME &&
      req.body.password === ROOT_PASSWORD
    ) {
      jwt.sign(
        {},
        AUTHENTICATION_SECRET,
        {
          algorithm: "RS256",
          issuer: "iotplatform",
          subject: "-1",
        },
        (err, token) => {
          let returnVals = {
            id: -1,
            name: "<root>",
            role: "SUPER_USER",
            username: "root",
            token: token
          };
          return res.json({ result: returnVals });
        }
      );
    } else if (!req.body.username) {
      return res.status(400).json({
        name: "NoUsernameProvided",
        errors: [{ message: "No username provided" }],
      });
    } else if (!req.body.password) {
      return res.status(400).json({
        name: "NoPasswordProvided",
        errors: [{ message: "No password provided" }],
      });
    } else {
      this.model
        .findOne({ where: { username: { [sqlOp.eq]: req.body.username } } })
        .then((data) => {
          if (data && bcrypt.compareSync(req.body.password, data.password)) {
            jwt.sign(
              {},
              AUTHENTICATION_SECRET,
              {
                algorithm: "RS256",
                issuer: "iotplatform",
                subject: data.id.toString(),
              },
              (err, token) => {
                let returnVals = {
                  id: data.id,
                  name: data.name,
                  role: data.role,
                  username: data.username,
                  token: token
                };
                return res.json({ result: returnVals });
              }
            );
          } else {
            return res.status(400).json({
              name: "InvalidCredential",
              errors: [{ message: "Invalid credential" }],
            });
          }
        })
        .catch((err) => responseError(res, err));
    }
  }

  async dashboardSignIn(req, res)
  {
    if(req.body.username && req.body.password)
    {
      if(req.body.username === ROOT_USERNAME && req.body.password === ROOT_PASSWORD)
      {
        return dashboardResponse(res, process.env.KUBE_DASH_TOKEN);
      }else{
        this.findAllOptions = {
          where: {
            username: {
              [sqlOp.eq]: req.body.username
            }
          }
        };
  
        try{
          let userData = await Users.findOne(this.findAllOptions);
          if(!userData)
          {
            return dashboardResponse(res,'', 'Failure',
                                'MSG_NOT_MATCHING_CAPS_USERNAME',
                                'Unauthorized', 401);
          }
          
          if(!rootRoles.includes(userData.role))
          {
            return dashboardResponse(res,'', 'Unauthorized',
                                      'MSG_INVALID_CAPS_USER_ROLE', 
                                      'Unauthorized', 401);
          }else{
            let compare = await bcrypt.compare(data.password, req.body.password);
            if(!compare)
            {
              return dashboardResponse(res,'', 'Forbidden',
                                        'MSG_INCORRECT_CAPS_PASSWORD',
                                        'Forbidden', 403);
            }
            return dashboardResponse(res, (userData.admin_token === '')? process.env.KUBE_DASH_TOKEN : userData.admin_token);
          }

        }catch(err){
          return dashboardResponse(res,'', 'Forbidden',
                                'MSG_UNEXPECTED_CAPS_ERROR',
                                'Forbidden', 500);
        }
      }
    }else{
      return dashboardResponse(res,'', 'Failure',
                                'MSG_EMPTY_CAPS_CREDENTIALS',
                                'Unauthorized', 401);
    }
  } 

  self(req, res) {
    var result = req.authenticated_as;
    delete result.password;
    res.json({ result });
  }
})();

module.exports = {
  getAll: controller.getAll.bind(controller),
  add: controller.add.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
  signin: controller.signin.bind(controller),
  dashboard: controller.dashboardSignIn.bind(controller),
  self: controller.self.bind(controller),
};
