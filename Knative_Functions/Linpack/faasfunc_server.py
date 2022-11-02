import argparse
from concurrent import futures
import logging

import grpc
from grpc_reflection.v1alpha import reflection
import faasfunc_pb2
import faasfunc_pb2_grpc

from numpy import matrix, linalg, random
from time import time

def linpack(n):
    # LINPACK benchmarks
    ops = (2.0 * n) * n * n / 3.0 + (2.0 * n) * n

    # Create AxA array of random numbers -0.5 to 0.5
    A = random.random_sample((n, n)) - 0.5
    B = A.sum(axis=1)

    # Convert to matrices
    A = matrix(A)
    B = matrix(B.reshape((n, 1)))

    # Ax = B
    start = time()
    x = linalg.solve(A, B)
    latency = time() - start

    mflops = (ops * 1e-6 / latency)

    result = {
        'mflops': mflops,
        'latency': latency
    }

    return result



class FaaSFunc(faasfunc_pb2_grpc.FaaSFuncServicer):
    def InvokeFunc(self, request, context):
        logging.info(f'Request name[{request.name}]')
        #Function logic goes here
        result = linpack(1024)
        logging.info(f'Time for computation [{result["latency"]}]')
        return faasfunc_pb2.InvokeReply(message='Invoked Function, %s!, Time: %s, MFlops: %s' % (request.name, str(result['latency']), str(result['mflops'])))


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