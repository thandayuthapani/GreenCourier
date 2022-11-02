from minio import Minio

minioAddress = "10.223.93.197:9000"
image_name = 'img2.jpeg'
image2_name = 'img3.jpeg'
image_path = '/data/pulled_' + image_name
image_path2 = '/data/pulled_' +image2_name

def test():
    minioClient = Minio(minioAddress,
                access_key='minioadmin',
                secret_key='minioadmin',
                secure=False)
    minioClient.fget_object('mybucket', image_name, image_path)

if __name__ == '__main__':
   test()