const { Minio } = require('../connections/minio')
// const { KafkaClient } =  require('../connections/kafka');
const { consoleLog } = require('../utils/express_utils')

async function initializations() {
  consoleLog('index.js', 'initializations', 'init', "Starting Initialiazations");
  
  // await KafkaClient.init();

  await require('./mysql').syncDataModels();
  // await require('./kafka').syncKafkaTopics();
  // await require('./connect').syncConnectJobs();

  consoleLog('index.js', 'initializations', 'init', "Init was successful!");

  // await Minio.init({
  //   minioEndpoint: process.env.MINIO_ENDPOINT,
  //   minioAccessKeyId: process.env.MINIO_ACCESS_KEY_ID,
  //   minioSecretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
  // });

  // await require('../controllers/SensorSchemaController').createDefaultSchema()
  //   .catch(err => consoleLog('index.js', 'initializations', 'createDefaultSchema', err));
  //   consoleLog('index.js', 'initializations', 'init', "Init finished!");
}

exports.initializations = initializations;