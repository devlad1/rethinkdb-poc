FROM schemas:0.1 as schemas-container

FROM golang:1.17-alpine

WORKDIR /app

COPY --from=schemas-container /schemas /schemas/
COPY go.sum ./
COPY go.mod ./

RUN sed 's#replace schemas \(.*\) => .*#replace schemas \1 => /schemas#1' go.mod
RUN go mod download

COPY . ./

RUN go build -o /server

EXPOSE 8082

ENV RETHINKDB_HOST="db"
# ENV SERVER_HOST="server:8082"

CMD [ "/server" ]
