FROM python:3.6-slim

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir pandas scikit-learn==0.22.1 protobuf==3.19.4 grpcio grpcio-tools grpcio-reflection minio

WORKDIR /app
COPY faasfunc_server.py faasfunc_pb2.py faasfunc_pb2_grpc.py ./

ENV PORT 50051
ENV MADDR "138.246.237.18:9000"
CMD python faasfunc_server.py -p $PORT -m $MADDR
