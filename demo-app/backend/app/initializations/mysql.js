const Sequelize = require('sequelize');
const sequelize = require("../connections/mysql");

async function syncDataModels() {
  //await sequelize.drop();
  //await sequelize.sync({ force: true });
  // const queryInterface = sequelize.getQueryInterface();
  // queryInterface.addConstraint("schemas", [])
  // queryInterface.addColumn("devices", "device_config", {
  //   type: Sequelize.TEXT,
  //   defaultValue: "{}"
  // });
  // queryInterface.addColumn('faasactions', 'cron_schedule', {
  //   type: Sequelize.BOOLEAN,
  //   allowNull: false,
  //   defaultValue: false
  // });
  // queryInterface.addColumn('faasactions', 'cron_schedule_time', {
  //   type: Sequelize.INTEGER,
  //   allowNull: false,
  //   defaultValue: 0
  // });

  await sequelize.sync();

  // queryInterface.addConstraint('sensors', {
  //   fields: ['schemaId'],
  //   type: 'foreign key',
  //   references: {
  //     table: 'schema',
  //     field: 'id'
  //   },
  //   onDelete: 'NO ACTION',
  // });
}

module.exports.syncDataModels = syncDataModels;
