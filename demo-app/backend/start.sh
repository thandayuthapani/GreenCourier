#!/bin/bash

/wait-for-it.sh $MARIADB --timeout=0 --strict
# /wait-for-it.sh $KAFKA --timeout=0 --strict
# /wait-for-it.sh $ZOOKEEPER --timeout=0 --strict
# /wait-for-it.sh $ELASTICSEARCH --timeout=0 --strict
#/wait-for-it.sh $FLINK --timeout=0 --strict

# wsk property set --apihost $OW_HOST --auth 23bc46b1-71f6-4ed5-8c54-816aa4f8c502:123zO3xZCLrMN6v2BKK1dXYFpXlPkccOFqm12CdAsMgRU4VrNZ9lyGVCGuMDGIwP

cd app

docker login -u caps -p E*smtNppe2,NXGKw registry.caps.in.tum.de
export DOCKER_CLI_EXPERIMENTAL=enabled

npm run start -- $MARIADB