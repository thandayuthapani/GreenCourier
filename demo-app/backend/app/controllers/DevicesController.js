const connection = require('../connections/mysql');
const {responseError, responseSystemError} = require('../utils/express_utils');
const Devices = require('../models/DevicesModel');
const Sensors = require('../models/SensorsModel');
const Users = require('../models/UsersModel');
const jwt = require('jsonwebtoken');
const {DEVICE_SECRET} = require('../secrets');
const bcrypt = require('bcryptjs');
const BaseController = require('./BaseController');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {addTopic, deleteTopic} = require('../connections/kafka');
//const {addFlinkJob, deleteFlinkJob} = require('../connections/flink');
const {addConnectJob, deleteConnectJob} = require('../connections/connect');
const {addElasticsearchIndex, deleteElasticsearchIndex} = require('../connections/elasticsearch');

const controller = new class extends BaseController {
    constructor() {
        super(Devices);
        this.findAllOptions = {
            include: [{model: Sensors}],
        }
    }
    // TODO: Change all functions to use async and remove the usage of BaseController
    //       Remove also the second query for user information
    getAll(req, res) {
        if (req.authenticated_as.id === -1){
                    Devices.findAll({include: [{model: Users}]}).then(datas => {
                        return res.status(200).json({result: datas});
                    }).catch(err => responseError(res, err));

        }else{
            Users.findById(req.authenticated_as.id).then(user => {
                if (!user) {
                    return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
                } else {
                    Devices.findAll({where: {userId: {[Op.eq]: user.id}}, include: [{model: Users}]}).then(datas => {
                        return res.status(200).json({result: datas});
                    }).catch(err => responseError(res, err));
                }
            }).catch(err => responseError(res, err));

        }

    }

    post_add(data, callback) {
        callback(data);
    }

    add(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Devices.create({
                    name: req.body.name,
                    description: req.body.description,
                    clientId: req.body.clientId,
                    password: req.body.password,
                    username: req.body.username,
                    url: req.body.url,
                    ttn_topic_to_subscribe: req.body.ttn_topic_to_subscribe,
                    device_config: req.body.device_config,
                    userId: user.id
                }).then(data => {
                    this.post_add(data, result_data => {
                        return res.status(200).json({result: result_data});
                    });
                }).catch(err => responseError(res, err));

            }
        }).catch(err => responseError(res, err));
    }

    update(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                console.log("Device Update: UserNotFound");
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                console.log("Device Update: User Found");
                Devices.findOne({
                    where: {
                        userId: {[Op.eq]: user.id},
                        id: {[Op.eq]: req.params.device_id}
                    }
                }).then(data => {
                    if (data) {
                        console.log("Device Update: Device Found");
                        delete req.body.id;
                        Devices.update(req.body, {where: {id: {[Op.eq]: data.id}}}).then(device => {
                            return res.status(200).json({result: device});
                        }).catch(err => responseError(res, err));
                    } else {
                        console.log("Device Update: Device Not Found");
                        return res.status(400).json({name: 'DeviceNotFound', errors: [{message: 'Device not found'}]});
                    }
                });
            }
        }).catch(err => responseError(res, err));
    }

    pre_delete(req, res, callback) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Devices.findOne({
                    where: {
                        userId: {[Op.eq]: user.id},
                        id: {[Op.eq]: req.params.device_id}
                    },
                    include: [{ model: Sensors }]
                }).then(device => {
                    if (device) {
                        console.log('DEvice Delete: Device found', device);
                        const USER_ID = user.id;
                        const DEVICE_ID = device.id;
                        const SENSORS_ID = device.sensors.map(sensor => sensor.id);

                        SENSORS_ID.forEach(sensor_id => {

                            Sensors.destroy({where: {id: {[Op.eq]: sensor_id}}}).then(sensor => {
                                const topic = `${USER_ID}_${DEVICE_ID}_${sensor_id}`;

                                // Delete Flink Job, then Kafka Topic, then Elasticsearch Index asynchronously.
                                deleteConnectJob(topic).then(() => {
                                    deleteTopic(topic).then(() => {
                                        deleteElasticsearchIndex(topic).catch(err => console.error(err));
                                    }).catch(err => console.error(`Kafka topic deletion error with exit code: ${err}`));
                                }).catch(err => console.error(err));
                                }).catch(err => responseError(res, err));
                        });
                        callback();
                    } else {
                        callback();
                    }
                }).catch(err => responseError(res, err));
            }
        }).catch(err => responseError(res, err));
    }

    delete(req, res) {
        this.pre_delete(req, res, () => {
            this.model.destroy({
                where: {
                    userId: {[Op.eq]: req.authenticated_as.id},
                    id: {[Op.eq]: req.params.device_id}
                }
            }).then(data => {
                return res.status(200).json({ result: data });
            }).catch(err => responseError(res, err));
        });
    }

    key(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Devices.findOne({
                    where: {
                        userId: {[Op.eq]: user.id},
                        id: {[Op.eq]: req.params.device_id}
                    }
                }).then(device => {
                    if (device) {
                        jwt.sign({}, DEVICE_SECRET, {
                            algorithm: 'RS256',
                            issuer: 'iotplatform',
                            subject: '' + user.id.toString() + '/' + device.id.toString()
                        }, (err, token) => {
                            return res.json({token, user_id: user.id, device_id: device.id});
                        });
                    } else {
                        return res.status(400).json({name: 'DeviceNotFound', errors: [{message: 'Device not found'}]});
                    }
                }).catch(err => responseError(res, err));
            }
        }).catch(err => responseError(res, err));
    }
};

module.exports = {
    getAll: controller.getAll.bind(controller),
    add: controller.add.bind(controller),
    update: controller.update.bind(controller),
    delete: controller.delete.bind(controller),
    key: controller.key.bind(controller),
};
