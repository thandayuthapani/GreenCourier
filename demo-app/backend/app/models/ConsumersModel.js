const Sequelize = require('sequelize');
const sequelize = require('../connections/mysql');

const Consumers = sequelize.define('consumers', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
    },
});

module.exports = Consumers;