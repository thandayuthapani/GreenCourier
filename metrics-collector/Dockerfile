FROM golang:1.16-alpine

WORKDIR /app

COPY go.mod go.mod
COPY go.sum go.sum
COPY api/ api/
COPY cmd/ cmd/
COPY routes/ routes/


RUN GOOS=linux GO111MODULE=on go mod vendor && \
    CGO_ENABLED=0 GOOS=linux GO111MODULE=on go build -a -o metrics-collector ./cmd


EXPOSE 8080

CMD [ "./metrics-collector" ]