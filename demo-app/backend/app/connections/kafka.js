const { Kafka } = require("kafkajs");
const ZOOKEEPER = require("./zookeeper");
const { consoleLog } = require('../utils/express_utils')
class KafkaClient {
  kafkaClient;

  static kafkaClientInstance;

  static async init() {
    const client = new Kafka({
      brokers: ['iot-kafka:9092'],
    });

    let instance = new KafkaClient(client);
    KafkaClient.kafkaClientInstance = instance;
    return instance;
  }

  constructor(client) {
    this.kafkaClient = client;
  }

  /**
   * 
   * @returns {KafkaClient}
   */
  static getInstance() {
    if (!KafkaClient.kafkaClientInstance) {
      throw new Error("Kafka Client is not initialized");
    }

    return KafkaClient.kafkaClientInstance;
  }
  /**
   * 
   * @param {String[]} topics 
   */
  async initTopics(topics) {
    const admin = this.kafkaClient.admin();
    let topic_cfg = [];
    for(let topic of topics)
    {
      topic_cfg.push({
        topic: topic,
        numPartitions: 1,
        replicationFactor: 1
      });
    }
    try {
      await admin.connect();
      await admin.createTopics({
        topics: topic_cfg,
      });
      consoleLog("kafka.js", "initTopics", "Success", "Topics were created");
    } catch(err) {
      consoleLog("kafka.js", "initTopics", "Failure", err);
    } finally {
      await admin.disconnect();
    }
    
  }
  
  /**
   * 
   * @param {String[]} topics 
   */
  async deleteTopics(topics) {
    const admin = this.kafkaClient.admin();
    await admin.connect();
    await admin.deleteTopics({
      topics: topics
    });
    await admin.disconnect();
  }

  async forwardToKafka(topic, messages)
  {
    const producer = this.kafkaClient.producer();
    try {
      await producer.connect();
      await producer.send({
        topic: topic,
        messages: messages
      });
    } catch (err) {
      consoleLog('kafka', 'forwardToKafka', 'error on sending message', err);
    } finally {
      await producer.disconnect();
    }
  }
}

exports.KafkaClient = KafkaClient;

// function addTopic(topic) {
//   console.log("Adding kafka topic", topic);
//   return new Promise(function (resolve, reject) {
//     const child = spawn(KAFKA_TOPIC_PATH, [
//       "--create",
//       "--partitions",
//       "1",
//       "--replication-factor",
//       "1",
//       "--topic",
//       topic,
//       "--zookeeper",
//       ZOOKEEPER,
//     ]);
//     console.log(KAFKA_TOPIC_PATH, [
//       "--create",
//       "--partitions",
//       "1",
//       "--replication-factor",
//       "1",
//       "--topic",
//       topic,
//       "--zookeeper",
//       ZOOKEEPER,
//     ]);

//     child.stdout.pipe(process.stdout);
//     child.stderr.pipe(process.stderr);

//     child.on("close", (code) => {
//       if (code == 0) {
//         console.log("Done adding kafka topic", topic);
//         resolve(code);
//       } else {
//         reject(code);
//       }
//     });
//   });
// }

// function deleteTopic(topic) {
//   console.log("Deleting kafka topic", topic);
//   return new Promise(function (resolve, reject) {
//     const child = spawn(KAFKA_TOPIC_PATH, [
//       "--delete",
//       "--zookeeper",
//       ZOOKEEPER,
//       "--topic",
//       topic,
//     ]);
//     console.log(KAFKA_TOPIC_PATH, [
//       "--delete",
//       "--zookeeper",
//       ZOOKEEPER,
//       "--topic",
//       topic,
//     ]);

//     child.stdout.pipe(process.stdout);
//     child.stderr.pipe(process.stderr);

//     child.on("close", (code) => {
//       if (code == 0) {
//         console.log("Done deleting kafka topic", topic);
//         resolve(code);
//       } else {
//         reject(code);
//       }
//     });
//   });
// }

// module.exports = {
//   addTopic,
//   deleteTopic,
//   host: process.env.KAFKA,
// };
