const elasticsearch = require('elasticsearch');

const host = process.env.ELASTICSEARCH;
const bin_port = process.env.ELASTICSEARCH_BIN_PORT;
//const host = 'iot.pcxd.me:9000';

const elasticClient = new elasticsearch.Client({
  hosts: [
    `http://${host}/`,
  ],
  httpAuth: `${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PASSWORD}`,
});

function addElasticsearchIndex(topic, valueMapping) {
  console.log("Adding elasticsearch index", topic);
  return new Promise(function (resolve, reject) {
    elasticClient.indices.create({
      index: topic,
    }, function (err, resp, status) {
      if (err) {
        reject(err);
      }
      else {
        console.log("Done adding elasticsearch index", topic);
        resolve(resp);

        /*var body = {
          sensorReading: {
            properties: {
              timestamp: { "type": "date" },
              sensor_id: { "type": "text" },
              value: valueMapping,
            },
          },
        }

        elasticClient.indices.putMapping({ index: topic, include_type_name: true, type: "sensorReading", body: body },
          function (err, resp, status) {
            if (err) {
              reject(err);
            } else {
              console.log("Done adding elasticsearch index", topic);
              resolve(resp);
            }
          }
        );*/
      }
    });
  });
}

function deleteElasticsearchIndex(topic) {
  console.log("Deleting elasticsearch index", topic);
  return new Promise(function (resolve, reject) {
    elasticClient.indices.delete({
      index: topic,
    }, function (err, resp, status) {
      if (err) {
        reject(err);
      }
      else {
        console.log("Done deleting elasticsearch index", topic);
        resolve(resp);
      }
    });
  });
}

module.exports = {
  host,
  bin_port,
  elasticClient,
  addElasticsearchIndex,
  deleteElasticsearchIndex,
};
