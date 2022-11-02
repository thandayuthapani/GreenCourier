
# A gRPC client for invoking the developed functions

### Usage

    docker run -it docker.io/kkyfury/grpc-client:v1 /bin/bash
    python3 faasfunc_client.py -s <function-url> -p 80 -f "<function-name>"