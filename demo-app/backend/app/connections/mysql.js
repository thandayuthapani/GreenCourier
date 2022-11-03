const Sequelize = require('sequelize');

const sequelize = new Sequelize('backend', 'root', 'mP6AMBTSSElsq1oQttZ1', {
  dialect: 'mysql',
  host: process.env.MARIADB.split(':')[0],
  port: parseInt(process.env.MARIADB.split(':')[1]),
  //host: "iot.pcxd.me",
  //port: 3306,
  operatorsAliases: Sequelize.Op,
});


module.exports = sequelize;
