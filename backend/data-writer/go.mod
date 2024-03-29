module writer

go 1.17

require gopkg.in/rethinkdb/rethinkdb-go.v6 v6.2.2

require schemas v0.0.0

require github.com/felixge/httpsnoop v1.0.1 // indirect

require (
	github.com/golang/protobuf v1.3.4 // indirect
	github.com/gorilla/handlers v1.5.1
	github.com/gorilla/mux v1.8.0
	github.com/hailocab/go-hostpool v0.0.0-20160125115350-e80d13ce29ed // indirect
	github.com/opentracing/opentracing-go v1.1.0 // indirect
	github.com/sirupsen/logrus v1.0.6 // indirect
	golang.org/x/crypto v0.0.0-20200302210943-78000ba7a073 // indirect
	golang.org/x/net v0.0.0-20190404232315-eb5bcb51f2a3 // indirect
	golang.org/x/sys v0.0.0-20220520151302-bc2c85ada10a // indirect
	gopkg.in/cenkalti/backoff.v2 v2.2.1 // indirect
)

replace schemas v0.0.0 => ../schemas
