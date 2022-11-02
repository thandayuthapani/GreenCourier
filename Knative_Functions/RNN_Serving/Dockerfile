FROM python:3.6-slim

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir torch==1.10.2+cpu torchvision==0.11.3+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html
RUN pip install --no-cache-dir protobuf==3.19.4 grpcio grpcio-tools grpcio-reflection 

WORKDIR /app
COPY faasfunc_server.py faasfunc_pb2.py faasfunc_pb2_grpc.py rnn_model.pth rnn_params.pkl rnn.py ./

ENV PORT 50051
CMD python faasfunc_server.py -p $PORT
