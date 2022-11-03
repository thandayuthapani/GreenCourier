//@ts-check
const { S3Client, ListBucketsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');


class Minio {
    /**
     * @type {S3Client}
     */
    client;

    /**
     * @type {Minio}
     */
    static instance;
    static async init(env) {
        if (
            !env.minioEndpoint
            || !env.minioAccessKeyId
            || !env.minioSecretAccessKey
        ) {
            throw new Error(`minio config is missing. Config is ${JSON.stringify(env)}`);
        }
        const client = new S3Client({
            region: 'us-east-1', // region is required by the library
            endpoint: env.minioEndpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId: env.minioAccessKeyId,
                secretAccessKey: env.minioSecretAccessKey,
            },
        });
        let instance = new Minio(client);
        Minio.instance = instance;
        return instance;
    }

    /**
     * @returns {Minio}
     */
    static getInstance() {
        if (!Minio.instance) {
            throw new Error('Minio instance not initialized');
        }
        return Minio.instance;
    }

    /**
     * @param {S3Client} client 
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * 
     * @param {string} bucketName 
     * @param {string} fileName 
     * @param {import('express').Response} expressResponse 
     * @param {string | undefined} range 
     * @returns {Promise<void>}
     */
    async downloadFile(bucketName, fileName, expressResponse, range) {
        if (!await this.bucketExists(bucketName)) {
            expressResponse.status(404).json({ name: 'BucketNotFound', errors: [{ message: 'Bucket not found' }] });
            return;
        }
        const bucketParams = {
            Bucket: bucketName,
            Key: fileName,
            ...(range ? { Range: range } : {}),
        };
        try {
            const fileStream = await this.client.send(new GetObjectCommand(bucketParams));
            if (!fileStream.Body) {
                expressResponse.status(500).json({ name: 'stream has no body', errors: [{ message: 'stream has np body' }] });
                return;
            }
            fileStream.Body.pipe(expressResponse)
        } catch (err) {
            if (err.Code === 'NoSuchKey') {
                expressResponse.status(404).json({ name: 'FileNotFound', errors: [err] });
                return;
            }
            console.error(err);
            expressResponse.status(500).json({ name: 'InternalServerError' });
            return;
        }
    }

    /**
     * 
     * @param {string} bucketName 
     * @returns { Promise<boolean>}
     */
    async bucketExists(bucketName) {
        const listBucketsCommandResult = await this.client.send(new ListBucketsCommand({}));
        if (!listBucketsCommandResult.Buckets) {
            return false;
        }
        console.log('MinIo Buckets:', listBucketsCommandResult.Buckets.map(x => x.Name));
        return !!listBucketsCommandResult.Buckets.find(x => x.Name === bucketName);
    }
}

exports.Minio = Minio;
