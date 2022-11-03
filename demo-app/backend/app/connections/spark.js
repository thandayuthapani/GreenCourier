const cron = require('node-cron');
const elasticsearch = require('../connections/elasticsearch');
const kafka = require('../connections/kafka');
const exec = require('child_process').exec;
const k8s = require('@kubernetes/client-node');

var cronTable = {};

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
var k8Server = kc.getCurrentCluster().server;

const upload_file = 'spark-batch-processing-0.0.1-SNAPSHOT.jar';
const filePath = 'local:///opt/spark/jars-examples/';
const mainClass = 'main.Main';
const imageName = 'registry.gitlab.com/tum-iot-lab/spark:latest';

function addCronTabSpark(prediction, topic, index){

    console.log('running a task every minute');
    console.log('K8 API Server: '+ k8Server);

    if(cron.validate(prediction.crontab)){

        var sparkSubmit = `spark-submit ` +
            `--master k8s://${k8Server} ` +
            `--deploy-mode cluster ` +
            `--name crontab_${prediction.id} ` +
            `--class ` + mainClass + ' ' +
            `--conf spark.executor.instances=` + prediction.executors + ' ' +
            `--conf spark.kubernetes.container.image=` + imageName + ' ' +
            filePath + upload_file + ' ' +
            '--index ' + index + ' ' +
            '--topic ' + topic + ' ' +
            '--alg ' + prediction.algorithm + ' ' +
            '--hours-predicted ' + prediction.predictionPeriod + ' ' +
            '--hours-data ' + prediction.dataPeriod + ' ' +
            '--es-address ' + elasticsearch.host + ' ' +
            '--kafka-address ' + kafka.host + ' ';

        console.log('Spark-submit: ' + sparkSubmit);

        var crontab = cron.schedule(prediction.crontab, () => {
            exec(sparkSubmit, (err, stdout, stderr) => {
                if (err) {
                    console.log('Error executing crontab ' + prediction.id + ': ' + err );
                }
            });
        });

        cronTable[prediction.id] = crontab;
        crontab.start();
    } else {
        console.log('Invalid cron expression: ' + prediction.crontab);
    }
}

function deleteCronTabSpark(crontabId){

    cronTable[crontabId].destroy();
    delete cronTable[crontabId];
}

module.exports = {
    addCronTabSpark,
    deleteCronTabSpark
};