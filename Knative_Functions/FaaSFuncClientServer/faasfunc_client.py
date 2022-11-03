import argparse
import logging
import grpc
from flask import Flask, request


import faasfunc_pb2
import faasfunc_pb2_grpc

#Setting timeout for client to 5mins
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)


def run(target, funcname):
    with grpc.insecure_channel(target,
     options=[('grpc.lb_policy_name', 'pick_first'),
                                        ('grpc.enable_retries', 0),
                                        ('grpc.keepalive_timeout_ms', 300000)
                                       ]) as channel:
        stub = faasfunc_pb2_grpc.FaaSFuncStub(channel)
        #Specify Function name Here
        #Todos, possible to modify gRPC protobuffers to have function specific arguments so
        #There is no need for rebuilding docker image
        response = stub.InvokeFunc(faasfunc_pb2.InvokeRequest(name=funcname), timeout=300)
    print("gRPC client received: " + response.message)
    return response.message



def get_target(server, port):
    prefix = 'http://'
    server = server[len(prefix):] if server.startswith(prefix) else server
    logging.info(f'Sending gRPC client target on [{server}:{port}]')
    return f'{server}:{port}'

@app.route('/', methods=['POST'])
def main():
    # print(request.data)
    data = request.get_json()
    # print(data["function_url"], flush=True)
    function_url = data["function_url"]
    function_name = data["function_name"]
    app.logger.info(f'Data {function_url}')
    response = run(get_target(function_url, "80"), function_name)
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000, host="grpcclientserver")

    
# if __name__ == '__main__':
#     logging.basicConfig(level=logging.INFO)
#     parser = argparse.ArgumentParser()
#     parser.add_argument('-s', '--server', type=str, default='localhost')
#     parser.add_argument('-p', '--port', type=int, default=50051)
#     parser.add_argument('-f', '--funcname', type=str, default='testfun')
#     args = parser.parse_args()
#     run(get_target(args.server, args.port), args.funcname)