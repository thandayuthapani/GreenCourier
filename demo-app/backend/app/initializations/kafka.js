const { KafkaClient } = require("../connections/kafka");
const Sensors = require("../models/SensorsModel");
const Devices = require("../models/DevicesModel");
const Users = require('../models/UsersModel');
const { elasticClient,addElasticsearchIndex } = require('../connections/elasticsearch');
const { consoleLog } = require('../utils/express_utils')


async function syncKafkaTopics() {
  try {
    const sensors = await Sensors.findAll();
    let topics = [];
    for (let sensor of sensors) {
      const device = await Devices.findOne({ where: { id: sensor.deviceId } });
      if (device) {
        let topic = `${device.userId}_${sensor.deviceId}_${sensor.id}`;
        topics.push(topic);
      } else {
        console.log("Device not found");
      }
    }

    const users = await Users.findAll();
    for(let user of users)
    {
      let topic = `${user.id}_settings`;
      topics.push(topic);
    }

    let set = new Set(topics);      // remove topic duplicates
    topics = [...set];              // see: https://stackoverflow.com/a/23237765/8686682

    await KafkaClient.getInstance().initTopics(topics);

    let indeces = await elasticClient.cat.indices({format: 'json'});
    
    for(let index of indeces)
    {
      let idx = topics.indexOf(index.index);
      if( idx >= 0)
      {
        topics.splice(idx, 1);
      }
    }

    for(let topic of topics)
    {
      await addElasticsearchIndex(topic);
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports.syncKafkaTopics = syncKafkaTopics;
