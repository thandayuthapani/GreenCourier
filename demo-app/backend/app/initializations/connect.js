const connect = require("../connections/connect");
const Sensors = require("../models/SensorsModel");
const Devices = require("../models/DevicesModel");
const Schemas = require("../models/SensorSchema");
const Users = require("../models/UsersModel");
async function syncConnectJobs() {
  try {
    const jobs = await connect.getAllJobs();
    var job_names = {};

    for (let i = 0; i < jobs.length; i++) {
      job_names[jobs[i]] = true;
    }

    const sensors = await Sensors.findAll();

    let result = {
      "transforms.TimestampConverter.type":
        "org.apache.kafka.connect.transforms.TimestampConverter$Value",
      "transforms.TimestampConverter.target.type": "Timestamp",
      "transforms.TimestampConverter.field": "timestamp",
    };

    for (let sensor of sensors) {
      const device = await Devices.findOne({ where: { id: sensor.deviceId } });
      if (device) {
        let topic = `${device.userId}_${sensor.deviceId}_${sensor.id}`;
        if (!job_names[topic]) {
          const schema = await Schemas.findOne({
            where: { id: sensor.schemaId },
          });
          const schemaJSON = JSON.parse(schema.schema);

          let transformer = "TimestampConverter";

          schemaJSON.fields.forEach((field) => {
            if (field.type === "date") {
              let name = `${field.field}Converter`;
              transformer = `${transformer},${name}`;
              result = {
                [`transforms.${name}.type`]:
                  "org.apache.kafka.connect.transforms.TimestampConverter$Value",
                [`transforms.${name}.target.type`]: "Timestamp",
                [`transforms.${name}.field`]: `${field.field}`,
                ...result,
              };
            }
          });
          result = {
            transforms: transformer,
            ...result,
          };

          await connect.addConnectJob(topic, result);
        }
      } else {
        console.log("Device not found");
      }
    }

    const users = await Users.findAll();
    for (let user of users) {
      let topic = `${user.id}_settings`;
      if (!job_names[topic]) {
        await connect.addConnectJob(topic, result);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports.syncConnectJobs = syncConnectJobs;
// Sync flink jobs every 60 seconds.
//syncFlinkJobsInterval(60000);

// Sync flink jobs after 10 seconds.
//setTimeout(syncFlinkJobs, 10000);
