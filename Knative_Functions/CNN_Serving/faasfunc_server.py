import argparse
from concurrent import futures
import logging

import grpc
from grpc_reflection.v1alpha import reflection
import faasfunc_pb2
import faasfunc_pb2_grpc

import tensorflow as tf
from tensorflow.python.keras.preprocessing import image
from tensorflow.python.keras.applications.resnet50 import preprocess_input, decode_predictions
import numpy as np
from time import time

from squeezenet import SqueezeNet
session_conf = tf.ConfigProto(
              intra_op_parallelism_threads=1,
              inter_op_parallelism_threads=1)
sess = tf.Session(config=session_conf)

img = image.load_img('./image.jpg', target_size=(227, 227))
model = SqueezeNet(weights='imagenet')
model._make_predict_function() 
print("Model is ready for serving")


def make_prediction():
    start = time()
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    preds = model.predict(x)
    latency = time() - start
    return latency

class FaaSFunc(faasfunc_pb2_grpc.FaaSFuncServicer):
    def InvokeFunc(self, request, context):
        logging.info(f'Request name[{request.name}]')
        #Function logic goes here
        latency = make_prediction()
        logging.info(f'Time for computation[{latency}]')
        return faasfunc_pb2.InvokeReply(message='Invoked Function, %s!, Time: %s' % (request.name, str(latency)))


def serve(port):
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
    server.wait_for_termination()



if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', type=int, default=50051)
    args = parser.parse_args()
    serve(args.port)