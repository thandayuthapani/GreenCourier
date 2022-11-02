#!/bin/bash

CONTAINER_ID=$(docker ps | grep "kkyfury/k6basic:v1" | awk '{ print $1}')

influxdbIP=$1
influxdpPort=$2
serviceURL=$3
serviceName=$4
filename=$5

rm -rf ${filename}
# k6 run --out influxdb=http://${influxdbIP}:${influxdpPort}/myk6db -e SERVICE_URL=${serviceURL} -e FUNCTION_NAME=${serviceName} -e NUM_VUS=${numVUs} --console-output ${filename} /home/mohak/Project_Intel_Labs/AutoScaling/k6gRPCClientBasic/test.js 
docker exec -it ${CONTAINER_ID} k6 run --out influxdb=http://${influxdbIP}:${influxdpPort}/myk6db -e NUM_VUS=80 -e SERVICE_URL=${serviceURL} -e FUNCTION_NAME=${serviceName} --console-output ${filename} funcinvoker.js