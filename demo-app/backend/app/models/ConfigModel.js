const Sequelize = require('sequelize');
const sequelize = require('../connections/mysql');

const Config = sequelize.define('user_settings', {
  settings_json: {
    type: Sequelize.TEXT,
    defaultValue: '{}'
  }
});

module.exports = Config;