# Load generator based on k6 that generates gRPC requests to a deployed function according the Azure Function Traces

### Building the image
    cd k6gRPCClientAzure
    sudo docker build -f ./Dockerfile -t docker.io/kkyfury/k6azure:v1 .
### Usage
    docker run -it docker.io/kkyfury/k6azure:v1 /bin/bash
    k6 run --out influxdb=http://138.246.237.18:8086/myk6db -e SERVICE_URL=<func-url:80> -e FUNCTION_NAME=<func-name> funcinvoker.js