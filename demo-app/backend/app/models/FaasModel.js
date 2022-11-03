const Sequelize = require("sequelize");
const sequelize = require("../connections/mysql");

const FaaSActions = sequelize.define("faasactions", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  memory_config: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  activation_id: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  docker_image: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  cron_schedule: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cron_schedule_time: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = FaaSActions;
