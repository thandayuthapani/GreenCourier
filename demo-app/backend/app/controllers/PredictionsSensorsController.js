const connection = require('../connections/mysql');
const {responseError, responseSystemError} = require('../utils/express_utils');
const Predictions = require('../models/PredictionsModel');
const Sensors = require('../models/SensorsModel');
const Users = require('../models/UsersModel');
const BaseController = require('./BaseController');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const controller = new class {

    addPredictedSensor(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Predictions.findOne({where: {id: {[Op.eq]: req.params.prediction_id}}}).then(prediction => {
                    if (prediction) {
                        Sensors.findOne({where: {id: {[Op.eq]: req.body.sensor_id}}}).then(sensor => {
                            if (sensor) {
                                prediction.getSensors({where: {id: {[Op.eq]: req.body.sensor_id}}}).then(exist => {
                                    if (exist.length > 0) {
                                        return res.status(400).json({
                                            name: 'AlreadyPredicted',
                                            errors: [{message: 'Already predicted'}]
                                        });
                                    } else {
                                        prediction.addSensors(sensor).then(prediction_sensor => {
                                            return res.status(200).json({result: prediction_sensor});
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
                            name: 'PredictionNotFound',
                            errors: [{message: 'Prediction not found'}]
                        });
                    }
                }).catch(err => responseError(res, err));
            }
        }).catch(err => responseError(res, err));
    }
}
module.exports = {
    addPredictedSensor: controller.addPredictedSensor.bind(controller)
}