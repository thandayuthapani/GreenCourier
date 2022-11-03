const minio = require('minio');
const { miniohost, miniohosthostexposedport, accessKey, secretKey} = require('./common')

const minioClient = new minio.Client({
    endPoint: miniohost,
    port: miniohosthostexposedport,
    useSSL: false,
    accessKey: accessKey,
    secretKey: secretKey
});

module.exports = minioClient;