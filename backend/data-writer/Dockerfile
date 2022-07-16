FROM golang:1.17-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY *.go ./

RUN go build -o /data-writer

EXPOSE 8080

CMD [ "/data-writer" ]
