import argparse
from concurrent import futures
import logging

import grpc
from grpc_reflection.v1alpha import reflection
import faasfunc_pb2
import faasfunc_pb2_grpc

from PIL import Image
import ops
from time import time
from minio import Minio

minioAddress = ""
image_name = 'img4.jpg'
image_path = '/tmp/pulled_' + image_name



def image_processing():
    start = time()
    minioClient = Minio(minioAddress,
                access_key='minioadmin',
                secret_key='minioadmin',
                secure=False)
    minioClient.fget_object('mybucket', image_name, image_path)
    image = Image.open(image_path)
    image = ops.flip(image)
    image = ops.rotate(image)
    image = ops.filter_image(image)
    image = ops.gray_scale(image)
    image = ops.resize(image)
    latency = time() - start
    return latency

class FaaSFunc(faasfunc_pb2_grpc.FaaSFuncServicer):
    def InvokeFunc(self, request, context):
        logging.info(f'Request name[{request.name}]')
        #Function logic goes here
        latency = image_processing()
        logging.info(f'Time for computation[{latency}]')
        return faasfunc_pb2.InvokeReply(message='Invoked Function, %s!, Time: %s'% (request.name, str(latency)))


def serve(port, addr):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=1))
    faasfunc_pb2_grpc.add_FaaSFuncServicer_to_server(FaaSFunc(), server)

    SERVICE_NAMES = (
        faasfunc_pb2.DESCRIPTOR.services_by_name['FaaSFunc'].full_name,
        reflection.SERVICE_NAME,
    )

    reflection.enable_server_reflection(SERVICE_NAMES, server)
    server.add_insecure_port(f'[::]:{port}')
    logging.info(f'Starting gRPC server on port[{port}]')
    server.start()
    global minioAddress
    minioAddress = addr
    logging.info(f'Minio server address [{minioAddress}]')
    server.wait_for_termination()



if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', type=int, default=50051)
    parser.add_argument('-m', '--minioaddr', type=str)
    args = parser.parse_args()
    serve(args.port, args.minioaddr)