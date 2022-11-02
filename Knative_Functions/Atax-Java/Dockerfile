
# Use the official maven/Java 8 image to create a build artifact.
# https://hub.docker.com/_/maven
FROM maven:3.8-jdk-11 as builder

# Copy local code to the container image.
WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build a release artifact.
RUN mvn package -DskipTests

# Use AdoptOpenJDK for base image.
# It's important to use OpenJDK 8u191 or above that has container support enabled.
# https://hub.docker.com/r/adoptopenjdk/openjdk8
# https://docs.docker.com/develop/develop-images/multistage-build/#use-multi-stage-builds
FROM adoptopenjdk/openjdk11:alpine-jre

# Copy the jar to the production image from the builder stage.
COPY --from=builder /app/target/functions-*.jar /run_atax.jar

# Run the web service on container startup.
CMD ["java", "-Djava.security.egd=file:/dev/./urandom", "-Xmx8g", "-jar", "/run_atax.jar"]

# CMD ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/run_go_fast.jar", "M", "2"]
# CMD ["sh", "-c", "java /run_go_fast.jar -jar ${INPUT} ${THREADS}"]
# CMD java -jar /run_go_fast.jar ${INPUT} ${THREADS}
