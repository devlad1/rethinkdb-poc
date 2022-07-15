package main

import (
	"context"
	"rethink-poc-server/entitygenerator"
	"rethink-poc-server/rdbwriter"
)

func main() {
	rdbwriter.Init(context.Background())

	entitygenerator.Start()
}
