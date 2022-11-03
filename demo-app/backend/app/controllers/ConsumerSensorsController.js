const connection = require('../connections/mysql');
const {responseError, responseSystemError} = require('../utils/express_utils');
const Users = require('../models/UsersModel');
const Consumers = require('../models/ConsumersModel');
const Sensors = require('../models/SensorsModel');
const BaseController = require('./BaseController');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const controller = new class {

    enablePermission(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Consumers.findOne({
                    where: {
                        id: {[Op.eq]: req.params.consumer_id},
                        userId: {[Op.eq]: user.id}
                    }
                }).then(consumer => {
                    if (consumer) {
                        Sensors.findOne({where: {id: {[Op.eq]: req.body.sensor_id}}}).then(sensor => {
                            if (sensor) {
                                consumer.getSensors({where: {id: {[Op.eq]: req.body.sensor_id}}}).then(exist => {
                                    if (exist.length > 0) {
                                        return res.status(400).json({
                                            name: 'PermissionExist',
                                            errors: [{message: 'Permission exist'}]
                                        });
                                    } else {
                                        consumer.addSensors(sensor).then(consumer_sensor => {
                                            return res.status(200).json({result: consumer_sensor});
                                        }).catch(err => responseError(res, err));
                                    }
                                }).catch(err => responseError(res, err));
                            } else {
                                return res.status(400).json({
                                    name: 'SensorNotFound',
                                    errors: [{message: 'Sensor not found'}]
                                });
                            }
                        });
                    } else {
                        return res.status(400).json({
                            name: 'ConsumerNotFound',
                            errors: [{message: 'Consumer not found'}]
                        });
                    }
                }).catch(err => responseError(res, err));
            }
        }).catch(err => responseError(res, err));

    }

    disablePermission(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Consumers.findOne({
                    where: {
                        id: {
                            [Op.eq]: req.params.consumer_id
                        },
                        userId: {[Op.eq]: user.id}
                    }
                }).then(consumer => {
                    if (consumer) {
                        Sensors.findOne({where: {id: {[Op.eq]: req.params.sensor_id}}}).then(sensor => {
                            if (sensor) {
                                consumer.getSensors({where: {id: {[Op.eq]: req.params.sensor_id}}}).then(exist => {
                                    if (exist.length > 0) {
                                        consumer.removeSensors(sensor).then(result => {
                                            return res.status(200).json({result});
                                        }).catch(err => responseError(res, err));
                                    } else {
                                        return res.status(400).json({
                                            name: 'PermissionNotExist',
                                            errors: [{message: 'Permission not exist'}]
                                        });
                                    }
                                }).catch(err => responseError(res, err));
                            } else {
                                return res.status(400).json({
                                    name: 'SensorNotFound',
                                    errors: [{message: 'Sensor not found'}]
                                });
                            }
                        });
                    } else {
                        return res.status(400).json({
                            name: 'ConsumerNotFound',
                            errors: [{message: 'Consumer not found'}]
                        });
                    }
                }).catch(err => responseError(res, err));
            }
        }).catch(err => responseError(res, err));

    }
};

module.exports = {
    enablePermission: controller.enablePermission.bind(controller),
    disablePermission: controller.disablePermission.bind(controller),
};
