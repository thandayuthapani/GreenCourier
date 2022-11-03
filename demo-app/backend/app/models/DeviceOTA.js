const Sequelize = require("sequelize");
const sequelize = require("../connections/mysql");
const Devices = require('./DevicesModel');
const OTA = require('./OTAModel');

const DeviceOTA = sequelize.define('deviceotas', {
  otaName: {
    type: Sequelize.STRING,
    allowNull: false,
  }
});

Devices.belongsToMany(OTA, {through: DeviceOTA, onDelete: 'NO ACTION', foreignKey: 'devToOta'});
OTA.belongsToMany(Devices, {through: DeviceOTA, onDelete: 'NO ACTION', foreignKey: 'otaToDev'});

module.exports = DeviceOTA