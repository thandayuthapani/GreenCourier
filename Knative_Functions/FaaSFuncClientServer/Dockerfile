FROM python:3.8-slim

RUN pip install --no-cache-dir protobuf==3.19.4 grpcio grpcio-tools grpcio-reflection Flask

WORKDIR /app
COPY faasfunc_client.py faasfunc_pb2.py faasfunc_pb2_grpc.py ./

# CMD ["/bin/bash"]
# CMD [ "python3", "-m" , "flask", "--app", "faasfunc_client", "run", "--host=0.0.0.0"]