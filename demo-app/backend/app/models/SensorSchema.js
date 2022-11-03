const Sequelize = require('sequelize');
const sequelize = require('../connections/mysql');
const Sensors = require("./SensorsModel")

const Schema = sequelize.define('schemas',{
    id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    schema: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
});

module.exports = Schema;