const Sequelize = require('sequelize');
const sequelize = require('../connections/mysql');
const Alerts = require('../models/AlertsModel');

const Predictions = sequelize.define('predictions',{
    name:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
    },
    algorithm: {
        type:   Sequelize.ENUM,
        values: ['LINEAR_REGRESSION'],
        allowNull: false,
    },
    executors: {
        type: Sequelize.INTEGER,
        allowNull:false,
    },
    predictionPeriod: {
        type: Sequelize.INTEGER,
        allowNull:false,
    },
    dataPeriod: {
        type: Sequelize.INTEGER,
        allowNull:false,
    },
    crontab: {
        type: Sequelize.STRING,
        allowNull:false,
    }
});

Predictions.hasMany(Alerts, { onDelete: 'cascade' });
Alerts.belongsTo(Predictions,{ onDelete: 'cascade'});

module.exports = Predictions;