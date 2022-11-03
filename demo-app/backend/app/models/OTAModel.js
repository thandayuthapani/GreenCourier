const Sequelize = require("sequelize");
const sequelize = require("../connections/mysql");

const OTA = sequelize.define('ota', {
  filename: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  firmVersion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  changes: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  espIDFVer: {
    type: Sequelize.STRING,
    allowNull: false,
  }
});

module.exports = OTA