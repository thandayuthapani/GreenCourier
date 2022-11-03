const { openwhisk_api_host, openwhisk_api_key } = require("./common");
var openwhisk = require("openwhisk");
var opts = {
  apihost: openwhisk_api_host,
  api_key: openwhisk_api_key,
  ignore_certs: true,
};

const owClient = openwhisk(opts);

module.exports = owClient;
