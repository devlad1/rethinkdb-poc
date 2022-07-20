package main

import (
	"context"
	"writer/api"
	"writer/entitygenerator"
	"writer/rdbwriter"
)

func main() {
	rdbwriter.Init(context.Background())
	go entitygenerator.Start()
	api.Init()
}
