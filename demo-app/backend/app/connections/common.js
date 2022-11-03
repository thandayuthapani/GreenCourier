module.exports = {
    'mariadbhost': 'iot-mariadb.default.svc.cluster.local',
    'mariadbhostexposedport': 3306,
    'iotconnecthost': 'iot-connect.default.svc.cluster.local:8083',
    'elasticsearchhost': 'iot-elasticsearch.default.svc.cluster.local:9200',
    'elasticserachbinport': '9200',
    'zookeeperhost': 'iot-zookeeper.default.svc.cluster.local:2181',
    'kafkahost': 'iot-kafka.default.svc.cluster.local:9092',
    'miniohost': 'iot-minio-exposed.default.svc.cluster.local',
    'miniohosthostexposedport': 9900,
    'accessKey': 'minio',
    'secretKey': 'DjcfggrfVXj5zaLJ',
    'openwhisk_apihost':'owdev-nginx.openwhisk.svc.cluster.local:31001',
    'openwhisk_apiauth': '23bc46b1-71f6-4ed5-8c54-816aa4f8c502:123zO3xZCLrMN6v2BKK1dXYFpXlPkccOFqm12CdAsMgRU4VrNZ9lyGVCGuMDGIwP',
    'kibanaHostname': 'iot-kibana-exposed.default.svc.cluster.local',
    'kibanaPort': '5602',
    'elasticAccess': {
        auth: {
          username: 'elastic',
          password: 'CzJToWAkKYt4R71V7izW'
        },
        headers: {
          "kbn-xsrf": true,
          "Content-Type": "application/json"
        }
      },
    'rootRoles': ["SUPER_USER", "ADMIN"],
    'userRoles': ["USER"],
    'espSupport':["v4.0","v4.1","v4.2","v4.3","v4.4","v5.0"],
}