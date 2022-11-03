const flink = require('../connections/flink');
const Sensors = require('../models/SensorsModel');
const Users = require('../models/UsersModel');
const Devices = require('../models/DevicesModel');
const Alerts = require('../models/AlertsModel');
const fsp = require('fs').promises;

const flinkPath = './flink_jars/';

async function syncFlinkJobs() {
/*    try {
      const res = await flink.getAllJobs();
        const jobs = res.data["jobs"];
        var job_names = {};

        for (let job of jobs) {
            job_names[job.name] = true;
        }
        /!*
                const sensors = await Sensors.findAll();
                const flink_jar = 'flink-kafka-1.0.jar';
                const flink_jar_content = await fsp.readFile(flinkPath + flink_jar);
                for (let sensor of sensors) {
                    const device = await Devices.findOne({where: {id: sensor.deviceId}});

                    if(device){
                        var topic = `${device.userId}_${sensor.deviceId}_${sensor.id}`;
                        if (!job_names[topic]) {
                            if(!sensor.flink_jar) {
                                await flink.addFlinkJob(topic, `${topic}.jar`, flink_jar_content);
                            } else {
                                await flink.addFlinkJob(topic, `${topic}.jar`, sensor.flink_jar);
                            }
                        }
                    }else{
                        console.log("Device not found");
                    }


                }*!/
        const alerts = await Alerts.findAll();
        const flink_jar_alert = 'alert-notification-1.0.jar';
        const alert_jar_content = await fsp.readFile(flinkPath + flink_jar_alert)
        for (let alert of alerts) {
            var topic = `alert_${alert.id}`;
            if (!job_names[topic]) {
                await flink.addFlinkJobForAlert(topic, `default.jar`, alert_jar_content, alert.id, alert.value, alert.email, alert.alertType, alert.frequency, alert.name);
            }
        }
        
    } catch(err) {
        console.error(err);
    }*/
}

/*function syncFlinkJobsInterval(interval_ms) {
    var timer = setInterval(syncFlinkJobs, interval_ms);
    timer.unref();
}
syncFlinkJobs();*/
// Sync flink jobs every 60 seconds.
//syncFlinkJobsInterval(60000);

// Sync flink jobs after 10 seconds.
//setTimeout(syncFlinkJobs, 10000);

