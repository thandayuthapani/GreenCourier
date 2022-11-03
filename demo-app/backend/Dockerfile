FROM node:14.0.0

RUN apt-get update -qq \
    && apt-get install -y libzmq3-dev build-essential make \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN apt-get update \
    && apt-get install -y apt-utils \
    && apt-get update \
    && apt-get install -y apt-transport-https \
    && apt-get update \
    && apt-get install -y ca-certificates curl gnupg lsb-release \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update && apt-get install -y docker-ce-cli \
    && export DOCKER_CLI_EXPERIMENTAL=enabled

# ENV MARIADB '138.246.236.181:3306'
# ENV KAFKA '138.246.236.181:9092'
# ENV ZOOKEEPER '138.246.236.181:2181'
# ENV ELASTICSEARCH '138.246.236.181:9200'
# ENV OW_HOST '138.246.236.181:31001'
# ENV CONNECT '138.246.236.181:8083'
# RUN export MARIADB && export KAFKA && export ZOOKEEPER \
#     && export ELASTICSEARCH && export OW_HOST \
#     && export CONNECT

RUN wget https://github.com/apache/openwhisk-cli/releases/download/1.2.0/OpenWhisk_CLI-1.2.0-linux-amd64.tgz \
    && tar -zxvf OpenWhisk_CLI-1.2.0-linux-amd64.tgz \
    && mv wsk /usr/local/bin/wsk



# Install Java.
RUN apt-get update && \
    apt-get install -y openjdk-8-jre && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/ && \
    rm -rf /var/cache/oracle-jdk8-installer;

# Define commonly used JAVA_HOME variable
RUN update-alternatives --config java
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/
RUN export JAVA_HOME

COPY app /app/

COPY web /app/web_tmp/

RUN mkdir -p /app/public/static/ 

RUN cd /app/web_tmp && npm install --no-optional && \
	npm rebuild node-sass --force && \
	npm run build && \
	cp -a /app/web_tmp/dist/. /app/public/static/ && \
	rm -rf /app/web_tmp/


COPY web/index.html /app/public/index.html
COPY web/logo.ico /app/public/logo.ico
#COPY web/dist /app/public/static

RUN chmod -R a+x /app \
    && cd /app \
    && npm install --no-optional --save \
    && cd ../

# SPARK
# ENV SPARK_VERSION 2.4.5
# ENV HADOOP_VERSION 2.7
# ENV SPARK_PACKAGE spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}
# ENV SPARK_HOME /usr/${SPARK_PACKAGE}
# ENV PATH $PATH:${SPARK_HOME}/bin

# RUN wget "http://mirror.synyx.de/apache/spark/spark-${SPARK_VERSION}/${SPARK_PACKAGE}.tgz" &&\ 
# 	tar -xzf /$SPARK_PACKAGE.tgz -C /usr/

COPY wait-for-it.sh /
RUN chmod a+x /wait-for-it.sh

# add entrypoint script
USER root
COPY start.sh /
RUN chmod a+x /start.sh

EXPOSE 3000

ENTRYPOINT /start.sh
