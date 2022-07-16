package main

import (
	"context"
	"writer/entitygenerator"
	"writer/rdbwriter"
)

func main() {
	rdbwriter.Init(context.Background())

	entitygenerator.Start()
}
