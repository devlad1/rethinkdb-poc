package rethinkdb_test

import (
	"fmt"
	"log"

	rdb "gopkg.in/rethinkdb/rethinkdb-go.v6"
)

func Example() {
	session, err := rdb.Connect(rdb.ConnectOpts{
		Address: "localhost", // endpoint without http
	})
	if err != nil {
		log.Fatalln(err)
	}

	res, err := rdb.Expr("Hello World").Run(session)
	if err != nil {
		log.Fatalln(err)
	}

	var response string
	err = res.One(&response)
	if err != nil {
		log.Fatalln(err)
	}

	fmt.Println(response)

	// Output:
	// Hello World
}
