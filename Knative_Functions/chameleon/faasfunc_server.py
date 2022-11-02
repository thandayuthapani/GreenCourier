import argparse
from concurrent import futures
import logging

import grpc
from grpc_reflection.v1alpha import reflection
import faasfunc_pb2
import faasfunc_pb2_grpc

import six
from chameleon import PageTemplate
from time import time



BIGTABLE_ZPT = """\
<table xmlns="http://www.w3.org/1999/xhtml"
xmlns:tal="http://xml.zope.org/namespaces/tal">
<tr tal:repeat="row python: options['table']">
<td tal:repeat="c python: row.values()">
<span tal:define="d python: c + 1"
tal:attributes="class python: 'column-' + %s(d)"
tal:content="python: d" />
</td>
</tr>
</table>""" % six.text_type.__name__

def render_website():
    start = time()
    
    tmpl = PageTemplate(BIGTABLE_ZPT)
    data = {}
    num_of_cols = 15
    num_of_rows = 10

    for i in range(num_of_cols):
        data[str(i)] = i
    
    table = [data for x in range(num_of_rows)]
    options = {'table': table}
    data = tmpl.render(options=options)
    latency = time() - start
    return latency


class FaaSFunc(faasfunc_pb2_grpc.FaaSFuncServicer):
    def InvokeFunc(self, request, context):
        logging.info(f'Request name[{request.name}]')
        #Function logic goes here
        latency = render_website()
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