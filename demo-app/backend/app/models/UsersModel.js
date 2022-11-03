const Sequelize = require("sequelize");
const sequelize = require("../connections/mysql");
const Alerts = require("./AlertsModel");
const Devices = require("./DevicesModel");
const Consumers = require("./ConsumersModel");
const Predictions = require("./PredictionsModel");
const FaaSActions = require("./FaasModel");
const OTA = require('./OTAModel')
const Schemas = require('./SensorSchema');
const Config = require('./ConfigModel');

const Users = sequelize.define("users", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^\S+([ ]\S+)*$/,
        msg: "Name is invalid.",
      },
    },
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: /^[a-z0-9_]{3,30}$/,
        msg: "Username can contain only 3-30 lowercase a-z, 0-9 and _.",
      },
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [["ADMIN", "USER"]],
    },
  },
  admin_token: {
    type: Sequelize.STRING,
    allowNull: true
  }
});

Users.hasMany(Devices, { onDelete: "cascade" });
Devices.belongsTo(Users, { onDelete: "cascade" });

Users.hasMany(Consumers, { onDelete: "cascade" });
Consumers.belongsTo(Users, { onDelete: "cascade" });

Users.hasMany(Predictions, { onDelete: "cascade" });
Predictions.belongsTo(Users, { onDelete: "cascade" });

Users.hasMany(Alerts, { onDelete: "cascade" });
Alerts.belongsTo(Users, { onDelete: "cascade" });

Users.hasMany(FaaSActions, { onDelete: "cascade" });
FaaSActions.belongsTo(Users, { onDelete: "cascade" });

Users.hasMany(OTA, { onDelete: "cascade" });
OTA.belongsTo(Users, { onDelete: "cascade" })

Users.hasMany(Schemas, {onDelete: 'cascade'});
Schemas.belongsTo(Users, {onDelete: 'cascade'});

Users.hasMany(Config, {onDelete: 'cascade'});
Config.belongsTo(Users, {onDelete: 'cascade'});

module.exports = Users;
