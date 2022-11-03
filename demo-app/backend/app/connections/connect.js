const axios = require('axios');
const request = require('request');
const { consoleLog } = require('../utils/express_utils');

const host = 'http://' + process.env.CONNECT + '/';

const ELASTICSEARCH_HOST = 'http://' + process.env.ELASTICSEARCH;

function addConnectJob(topic, transforms = {}) {
    consoleLog('connect.js', 'addConnectJob', 'Generate Promise', `Adding connector: ${topic}`);
    return new Promise(function (resolve, reject) {        
        let config = {
            "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
            "tasks.max": "1",
            "topics": topic,
            "key.ignore": "true",
            "connection.url": ELASTICSEARCH_HOST,
            "connection.username": process.env.ELASTICSEARCH_USER,
            "connection.password": process.env.ELASTICSEARCH_PASSWORD,
            "type.name": "test-type",
            "read.timeout.ms": "20000",
            "name": topic,
            ...transforms
        };

        let body_data = {
            "name": topic,
            "config": config
        };

        request({
            method: 'post',
            url: `${host}connectors/`,
            headers: { "Content-Type": "application/json" },
            json: body_data,
        }, function (err, response, body) {
            if (err) {
                consoleLog('connect.js', 'addConnectJob', 'request', `Could not add connector with topic: ${topic}`);
                reject(err);
            } else {
                if(response.body.error_code === 409)
                {
                    consoleLog('connect.js', 'addConnectJob', 'request', `Connector with topic: ${topic} already exist! Updating config!`);
                    request({
                        method: 'put',
                        url: `${host}connectors/${topic}/config`,
                        headers: { "Content-Type": "application/json" },
                        json: config,
                    }, (err, response, body) => {
                        if(err){
                            consoleLog('connect.js', 'addConnectJob', 'request -> request', `Updating topic: ${topic} failed!`);
                            console.error(err);
                            return reject(response);
                        }
                        else{
                            consoleLog('connect.js', 'addConnectJob', 'request -> request', `Updating topic: ${topic} finished!`);
                            return resolve(response);
                        }
                    });
                }
                consoleLog('connect.js', 'addConnectJob', 'request', `Connector with topic: ${topic} is started!`);
                return resolve(response);
            }
        });
    });
}


function getAllJobs() {
    return axios.get(`${host}connectors/`);
}


function deleteConnectJob(name) {
    consoleLog('connect.js', 'deleteConnectJob', 'Generate promise', `Deleting connector job with name: ${name}`);
    return new Promise(function (resolve, reject) {
        request({
            method: 'delete',
            url: `${host}connectors/${name}/`,
            headers: { "Content-Type": "application/json" },
        }, (err, response, body) => {
            if(err){
                consoleLog('connect.js', 'deleteConnectJob', 'request', `Connector with name: ${name} could not be deleted`);
                return reject(err);
            }
            consoleLog('connect.js', 'deleteConnectJob', 'request', `Connector with name: ${name} was deleted!`);
            return resolve()
        })
    });
}

module.exports = {
    host,
    addConnectJob,
    getAllJobs,
    deleteConnectJob,
};
