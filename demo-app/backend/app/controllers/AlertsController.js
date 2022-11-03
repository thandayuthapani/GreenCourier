/*
const {responseError} = require('../utils/express_utils');

const Sensors = require('../models/SensorsModel');
const Predictions = require('../models/PredictionsModel')
const Devices = require('../models/DevicesModel');
const Alerts = require('../models/AlertsModel');
const Users = require('../models/UsersModel');
const BaseController = require('./BaseController');
const {addFlinkJobForAlert, deleteFlinkJob} = require('../connections/flink');
const fs = require('fs');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const controller = new class extends BaseController {
    constructor() {
        super(Alerts);
        this.findAllOptions = {
            include: [{model: Sensors, include: [{model: Devices}]}, {model: Predictions}],
        }
    }

    getAll(req, res) {
        console.log(req.authenticated_as);
        if (req.authenticated_as.id === -1) {
            Alerts.findAll({}).then(datas => {
                return res.status(200).json({result: datas});
            }).catch(err => responseError(res, err));

        } else {
            Users.findById(req.authenticated_as.id).then(user => {
                if (!user) {
                    return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
                } else {
                    Alerts.findAll({where: {userId: {[Op.eq]: user.id}}, include: [{model: Sensors, include: [{model: Devices}]}, {model: Predictions}]}).then(datas => {
                        return res.status(200).json({result: datas});
                    }).catch(err => responseError(res, err));
                }
            }).catch(err => responseError(res, err));

        }

    }


    add(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                if (req.body.sensor_id != null) {
                    console.log('Alarma de sensor');
                    Sensors.findById(req.body.sensor_id).then(sensor => this.createAlarm(req, res, sensor));
                } else if (req.body.prediction_id != null) {
                    console.log('Alarma de predicción');
                    Predictions.findById(req.body.prediction_id).then(prediction => this.createAlarm(req, res, prediction));
                }

            }
        }).catch(err => responseError(res, err));

    }

    createAlarm(req, res, data) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Alerts.create({
                    name: req.body.name,
                    alertType: req.body.alertType,
                    alertSource: req.body.alertSource,
                    value: req.body.value,
                    email: req.body.email,
                    sensorId: req.body.sensor_id,
                    userId: user.id,
                    predictionId: req.body.prediction_id,
                    frequency: req.body.frequency
                }).then(alert => {
                    if (alert.sensorId != null)
                        var topic = `${user.id}_${data.deviceId}_${data.id}`;
                    else if (alert.predictionId != null)
                        var topic = `predictions_${data.id}`;
                    console.log(topic);
                    //
                    // // Add Elasticsearch Index, then Kafka Topic, then Flink Job asynchronously.
                    // addElasticsearchIndex(topic, JSON.parse(req.body.mapping)).then(() => {
                    //     addTopic(topic).then(() => {
                    //         addFlinkJob(topic, `${topic}.jar`, req.file.buffer).catch(err => console.error(err));
                    //     }).catch(err => console.error(`Kafka topic creation error with exit code: ${err}`));
                    // }).catch(err => console.error(err));
                    const upload_file = 'alert-notification-1.0.jar';
                    const filePath = './flink_jars/';
                    fs.readFile(filePath + upload_file, function (_err, content) {
                        // Add Flink Job asynchronously.
                        addFlinkJobForAlert(topic, `default.jar`, content, alert.id, req.body.value, req.body.email, req.body.alertType, alert.frequency, alert.name).catch(err => console.error(err));
                        //req.body.name should be changed to alertId, NOtification content should be handled on the web side. (Muthu)
                    });
                    return res.json(alert);
                }).catch(err => responseError(res, err));
            }
        }).catch(err => responseError(res, err));

    }

    delete(req, res) {
        this.pre_delete(req, res, () => {
            Users.findById(req.authenticated_as.id).then(user => {
                if (!user) {
                    return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
                } else {
                    Alerts.findById(req.params.id, {
                        include: [{
                            model: Sensors,
                            include: [{model: Devices}]
                        }]
                    }).then(data => {
                        if (data) {
                            var topic = `alert_${data.id}`;
                            console.log("Alert ID to delete Flink job", topic);
                            deleteFlinkJob(topic).then(flink => {
                                Alerts.destroy({where: {id: {[Op.eq]: req.params.id}}}).then(data => {
                                    return res.status(200).json({result: data});
                                }).catch(err => responseError(res, err));
                            }).catch(err => console.error(err));
                        } else {
                            return res.status(400).json({
                                name: 'AlertsNotFound',
                                errors: [{message: 'Alerts not found'}]
                            });
                        }
                    });
                }
            }).catch(err => responseError(res, err));
        });
    }
};
module.exports = {
    getAll: controller.getAll.bind(controller),
    add: controller.add.bind(controller),
    update: controller.update.bind(controller),
    delete: controller.delete.bind(controller),
}*/
