import argparse
from concurrent import futures
import logging


import grpc
from grpc_reflection.v1alpha import reflection
import faasfunc_pb2
import faasfunc_pb2_grpc

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import pandas as pd
import re
from time import time
from minio import Minio

cleanup_re = re.compile('[^a-z]+')

def cleanup(sentence):
    sentence = sentence.lower()
    sentence = cleanup_re.sub(' ', sentence).strip()
    return sentence

minioAddress = ""
df_name = 'dataset.csv'
df_path = '/tmp/pulled_' + df_name


def train():
    start = time()
    minioClient = Minio(minioAddress,
                access_key='minioadmin',
                secret_key='minioadmin',
                secure=False)
    minioClient.fget_object('mybucket', df_name, df_path)
    df = pd.read_csv(df_path)
    df['train'] = df['Text'].apply(cleanup)
    tfidf_vector = TfidfVectorizer(min_df=100).fit(df['train'])
    train = tfidf_vector.transform(df['train'])
    model = LogisticRegression()
    model.fit(train, df['Score'])
    latency = time() - start
    return latency

class FaaSFunc(faasfunc_pb2_grpc.FaaSFuncServicer):
    def InvokeFunc(self, request, context):
        logging.info(f'Request name[{request.name}]')
        #Function logic goes here
        latency = train()
        logging.info(f'Time for computation[{latency}]')
        return faasfunc_pb2.InvokeReply(message='Invoked Function, %s!, Time: %s' % (request.name, str(latency)))


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