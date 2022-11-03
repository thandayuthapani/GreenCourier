const Sequelize = require("sequelize");
const sequelize = require("../connections/mysql");

const Alerts = sequelize.define("alerts", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  alertType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  alertSource: {
    type: Sequelize.ENUM,
    values: ["SENSOR", "FORECAST"],
    allowNull: false,
  },
  value: {
    type: Sequelize.DataTypes.FLOAT,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  frequency: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = Alerts;
