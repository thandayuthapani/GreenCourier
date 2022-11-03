const connection = require("../connections/mysql");
const {
  responseError,
  responseSystemError,
  genericResponse
} = require("../utils/express_utils");
const Users = require("../models/UsersModel");
const Sensors = require("../models/SensorsModel");
const Devices = require("../models/DevicesModel");
const Schema = require('../models/SensorSchema')
const jwt = require("jsonwebtoken");
const { SENSOR_SECRET } = require("../secrets");
const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
// const { addTopic, deleteTopic } = require("../connections/kafka");
const { KafkaClient } = require('../connections/kafka');
//const {addFlinkJob, deleteFlinkJob} = require('../connections/flink');
const { addConnectJob, deleteConnectJob } = require("../connections/connect");
const { Minio } = require('../connections/minio');

const {
  addElasticsearchIndex,
  deleteElasticsearchIndex,
} = require("../connections/elasticsearch");
const fs = require("fs");

const { userRoles, rootRoles } = require("../connections/common");

const controller = new (class {
  
  async getAll(req, res)
  {
    let findAllOptions = {
        where: {
          deviceId: {
            [Op.eq]: req.params.device_id
          }
        }
      }

    try{
      let userSensors = await Sensors.findAll(findAllOptions);
      if(!userSensors)
      {
        return res.status(200).end();
      }

      return res.status(200).json({result: userSensors});
    }catch(err){
      return responseError(res, err);
    }

  }

  _isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  async add(req, res) {
    try {
        const device = await Devices.findOne({
            where: {
                id: req.params.device_id,
                userId: { [Op.eq]: req.authenticated_as.id }
            }
        })
        if (!device) {
            return res.status(400).json({ name: 'DeviceNotFound', errors: [{ message: 'Device not found' }] });
        }

        const schema = await Schema.findOne({ where: { id: { [Op.eq]: req.body.schemaId } } });
        if (!schema) {
            return res.status(404).json({ name: 'SchemaNotFound', errors: [{ message: 'Schema not found' }] });

        }
        const sensor = await Sensors.create({
            name: req.body.name,
            description: req.body.description,
            deviceId: device.id,
            schemaId: schema.id,
        });
        var topic = `${req.authenticated_as.id}_${device.id}_${sensor.id}`;

        const schemaJSON = JSON.parse(schema.schema);

        let result = {	
          "transforms.TimestampConverter.type": "org.apache.kafka.connect.transforms.TimestampConverter$Value",
          "transforms.TimestampConverter.target.type": "Timestamp",
          "transforms.TimestampConverter.field": "timestamp"
                    }

        let transformer = 'TimestampConverter';
        
        schemaJSON.fields.forEach((field) => {
          if(field.type === 'date') {
            let name = `${field.field}Converter`;
            transformer = `${transformer},${name}`
            result = {
              [`transforms.${name}.type`]: "org.apache.kafka.connect.transforms.TimestampConverter$Value",
              [`transforms.${name}.target.type`]: "Timestamp",
              [`transforms.${name}.field`]: `${field.field}`,
              ...result
            }
          }
        });
        result = {
          'transforms': transformer,
          ...result
        };

        // Add Elasticsearch Index, then Kafka Topic, then Flink Job asynchronously.
        await addElasticsearchIndex(topic);
        await KafkaClient.getInstance().initTopics([topic]);
        await addConnectJob(topic, result);
        
        return res.json(sensor);

    } catch (err) {
        responseError(res, err)
    }
  }

  update(req, res) {
    Users.findOne({ where: { id: { [Op.eq]: req.authenticated_as.id } } }).then(user => {
        if (!user) {
            return res.status(400).json({ name: 'UserNotFound', errors: [{ message: 'User not found' }] });
        } else {
            Devices.findOne({
                where: {
                    id: req.params.device_id,
                    userId: { [Op.eq]: user.id }
                }
            }).then(device => {
                if (!device) {
                    return res.status(400).json({ name: 'DeviceNotFound', errors: [{ message: 'Device not found' }] });
                } else {
                    Sensors.findOne({
                        where: {
                            deviceId: { [Op.eq]: device.id },
                            id: { [Op.eq]: req.params.id }
                        }
                    }).then(data => {
                        if (data) {
                            delete req.body.id;
                            Sensors.update(req.body, { where: { id: { [Op.eq]: req.params.id } } }).then(sensor => {
                                return res.status(200).json({ result: sensor });
                            }).catch(err => responseError(res, err));
                        } else {
                            return res.status(400).json({
                                name: 'SensorNotFound',
                                errors: [{ message: 'Sensor not found' }]
                            });
                        }
                    });
                }
            }).catch(err => responseError(res, err));
        }
    }).catch(err => responseError(res, err));
  }

  delete(req, res) {
    Users.findOne({ where: { id: { [Op.eq]: req.authenticated_as.id } } })
      .then((user) => {
        if (!user) {
          return res
            .status(400)
            .json({
              name: "UserNotFound",
              errors: [{ message: "User not found" }],
            });
        } else {
          Devices.findOne({
            where: {
              id: req.params.device_id,
              userId: { [Op.eq]: user.id },
            },
          })
            .then((device) => {
              if (!device) {
                return res
                  .status(400)
                  .json({
                    name: "DeviceNotFound",
                    errors: [{ message: "Device not found" }],
                  });
              } else {
                Sensors.findOne({
                  where: {
                    deviceId: { [Op.eq]: device.id },
                    id: { [Op.eq]: req.params.id },
                  },
                }).then((data) => {
                  if (data) {
                    Sensors.destroy({
                      where: { id: { [Op.eq]: req.params.id } },
                    })
                      .then((sensor) => {
                        var topic = `${user.id}_${device.id}_${req.params.id}`;

                        // Delete Connect Job, then Kafka Topic, then Elasticsearch Index asynchronously.
                        deleteConnectJob(topic)
                          .then(() => {
                            deleteTopic(topic)
                              .then(() => {
                                deleteElasticsearchIndex(topic).catch((err) =>
                                  console.error(err)
                                );
                              })
                              .catch((err) =>
                                console.error(
                                  `Kafka topic deletion error with exit code: ${err}`
                                )
                              );
                          })
                          .catch((err) => console.error(err));

                        return res.status(200).json({ result: sensor });
                      })
                      .catch((err) => responseError(res, err));
                  } else {
                    return res.status(400).json({
                      name: "SensorNotFound",
                      errors: [{ message: "Sensor not found" }],
                    });
                  }
                });
              }
            })
            .catch((err) => responseError(res, err));
        }
      })
      .catch((err) => responseError(res, err));
  }

  async getFile(req, res) {
    try {
        const sensorId = req.params.id;
        const sensorIdfileFieldName = req.params.fileFieldName;
        const sensorIdFileId = req.params.fileId;
        const userId = req.authenticated_as.id;
        const deviceId = req.params.device_id;
        const user = await Users.findOne({ where: { id: { [Op.eq]: userId } } });
        if (!user) {
            return res.status(400).json({ name: 'UserNotFound', errors: [{ message: 'User not found' }] });
        }
        const device = await Devices.findOne({
            where: {
                id: deviceId,
                userId: { [Op.eq]: user.id }
            }
        });
        if (!device) {
            return res.status(400).json({ name: 'DeviceNotFound', errors: [{ message: 'Device not found' }] });
        }
        const sensor = await Sensors.findOne({
            where: {
                deviceId: { [Op.eq]: device.id },
                id: { [Op.eq]: sensorId }
            }
        });
        if (!sensor) {
            return res.status(400).json({
                name: 'SensorNotFound',
                errors: [{ message: 'Sensor not found' }]
            });
        }
        const escapedSensorIdfileFieldName = sensorIdfileFieldName.toLocaleLowerCase().replace(/_/sm, '.');
        const bucketName = `${userId}-${deviceId}-${sensorId}-${escapedSensorIdfileFieldName}`;
        await Minio.getInstance().downloadFile(bucketName, sensorIdFileId, res);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
  }
})();

module.exports = {
  getAll: controller.getAll.bind(controller),
  add: controller.add.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
  getFile: controller.getFile.bind(controller),
};
