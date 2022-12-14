# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import faasfunc_pb2 as faasfunc__pb2


class FaaSFuncStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.InvokeFunc = channel.unary_unary(
                '/Funcbench.FaaSFunc/InvokeFunc',
                request_serializer=faasfunc__pb2.InvokeRequest.SerializeToString,
                response_deserializer=faasfunc__pb2.InvokeReply.FromString,
                )


class FaaSFuncServicer(object):
    """Missing associated documentation comment in .proto file."""

    def InvokeFunc(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_FaaSFuncServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'InvokeFunc': grpc.unary_unary_rpc_method_handler(
                    servicer.InvokeFunc,
                    request_deserializer=faasfunc__pb2.InvokeRequest.FromString,
                    response_serializer=faasfunc__pb2.InvokeReply.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'Funcbench.FaaSFunc', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class FaaSFunc(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def InvokeFunc(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/Funcbench.FaaSFunc/InvokeFunc',
            faasfunc__pb2.InvokeRequest.SerializeToString,
            faasfunc__pb2.InvokeReply.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
