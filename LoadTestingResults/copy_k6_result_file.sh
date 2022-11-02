#!/bin/bash

CONTAINER_ID=$(docker ps | grep "kkyfury/k6basic:v1" | awk '{ print $1}')
echo "$CONTAINER_ID"
filename=$1

docker cp ${CONTAINER_ID}:/app/${filename} .
