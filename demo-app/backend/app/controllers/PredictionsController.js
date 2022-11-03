const {responseError, responseSystemError} = require('../utils/express_utils');
const Users = require('../models/UsersModel');
const Predictions = require('../models/PredictionsModel');
const Devices = require('../models/DevicesModel');
const Sensors = require('../models/SensorsModel');
const BaseController = require('./BaseController');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {addTopic, deleteTopic} = require('../connections/kafka');
const {addCronTabSpark, deleteCronTabSpark} = require('../connections/spark');

const controller = new class extends BaseController {
    constructor() {
        super(Predictions);
        this.findAllOptions = {
            include: [{model: Sensors, include: [{model: Devices}]}],
        }
    }

    getAll(req, res) {
        if (req.authenticated_as.id === -1) {
            Predictions.findAll({}).then(datas => {
                return res.status(200).json({result: datas});
            }).catch(err => responseError(res, err));

        } else {
            Users.findById(req.authenticated_as.id).then(user => {
                if (!user) {
                    return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
                } else {
                    Predictions.findAll({
                        where: {userId: {[Op.eq]: user.id}},
                        include: [{model: Sensors, include: [{model: Devices}]}]
                    }).then(datas => {
                        return res.status(200).json({result: datas});
                    }).catch(err => responseError(res, err));
                }
            }).catch(err => responseError(res, err));

        }

    }

    post_add(data, callback) {
        var topic = `predictions_${data.id}`;
        // Add Kafka Topic, then Crontab asynchronously.
        addTopic(topic).then(() => {
            console.log("Topic creado: " + topic);
            data.getSensors().then(sensors => {
                var index = sensors[0].deviceId + '_' + sensors[0].id;
                addCronTabSpark(data, topic, index);
            });
        }).catch(err => console.error(`Kafka topic creation error with exit code: ${err}`));
        callback(data);
    }


    add(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                Predictions.create({
                    name: req.body.name,
                    description: req.body.description,
                    algorithm: req.body.algorithm,
                    executors: req.body.executors,
                    predictionPeriod: req.body.predictionPeriod,
                    dataPeriod: req.body.dataPeriod,
                    crontab: req.body.crontab,
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
                console.log("Predictions Update: UserNotFound");
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                console.log("Predictions Update: User Found");
                Predictions.findOne({
                    where: {
                        userId: {[Op.eq]: user.id},
                        id: {[Op.eq]: req.params.id}
                    }
                }).then(data => {
                    if (data) {
                        console.log("Predictions Update: consumer Found");
                        delete req.body.id;
                        Predictions.update(req.body, {where: {id: {[Op.eq]: data.id}}}).then(device => {
                            return res.status(200).json({result: device});
                        }).catch(err => responseError(res, err));
                    } else {
                        console.log("Predictions Update: Predictions Not Found");
                        return res.status(400).json({
                            name: 'PredictionNotFound',
                            errors: [{message: 'Prediction not found'}]
                        });
                    }
                });
            }
        }).catch(err => responseError(res, err));
    }

    delete(req, res) {
        Users.findById(req.authenticated_as.id).then(user => {
            if (!user) {
                console.log("Predictions delete: UserNotFound");
                return res.status(400).json({name: 'UserNotFound', errors: [{message: 'User not found'}]});
            } else {
                this.pre_delete(req, res, () => {
                    this.model.destroy({
                        where: {
                            userId: {[Op.eq]: req.authenticated_as.id},
                            id: {[Op.eq]: req.params.id}
                        },
                        include: [{model: Sensors, include: [{model: Devices}]}]
                    }).then(data => {
                        if (data) {
                            var topic = `predictions_${data.id}`;

                            // Delete Crontab, then Kafka Topic asynchronously.
                            deleteCronTabSpark(data.id);
                            deleteTopic(topic).catch(err => console.error(`Kafka topic deletion error with exit code: ${err}`));
                            Predictions.destroy({where: {id: {[Op.eq]: req.params.id}}}).then(data => {
                                return res.status(200).json({result: data});
                            }).catch(err => responseError(res, err));
                        } else {
                            return res.status(400).json({
                                name: 'PredictionNotFound',
                                errors: [{message: 'Prediction not found'}]
                            });
                        }
                    }).catch(err => responseError(res, err));
                });
            }
        }).catch(err => responseError(res, err));
    }
};

module.exports = {
    getAll: controller.getAll.bind(controller),
    add: controller.add.bind(controller),
    delete: controller.delete.bind(controller)
};