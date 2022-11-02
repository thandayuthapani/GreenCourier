import argparse
from concurrent import futures
import logging

import grpc
from grpc_reflection.v1alpha import reflection
import faasfunc_pb2
import faasfunc_pb2_grpc

from time import time
from minio import Minio
import cv2


minioAddress = ""
video_name = 'vid1.mp4'
video_path = '/tmp/pulled_' + video_name
tmp = "/tmp/"


def video_processing():
    start = time()
    minioClient = Minio(minioAddress,
                access_key='minioadmin',
                secret_key='minioadmin',
                secure=False)
    
    minioClient.fget_object('mybucket', video_name, video_path)
    # result_file_path = tmp + video_path
    result_file_path = video_path + "_new"
    video = cv2.VideoCapture(video_path)

    width = int(video.get(3))
    height = int(video.get(4))
    
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(result_file_path, fourcc, 20.0, (width, height))

    while video.isOpened():
        ret, frame = video.read()

        if ret:
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            tmp_file_path = tmp+'tmp.jpg'
            cv2.imwrite(tmp_file_path, gray_frame)
            gray_frame = cv2.imread(tmp_file_path)
            out.write(gray_frame)
        else:
            break
    
    video.release()
    out.release()
    latency = time() - start
    return latency

class FaaSFunc(faasfunc_pb2_grpc.FaaSFuncServicer):
    def InvokeFunc(self, request, context):
        logging.info(f'Request name[{request.name}]')
        #Function logic goes here
        latency = video_processing()
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