package main

import (
	"context"
	"writer/api"
	"writer/rdbwriter"
)

func main() {
	rdbwriter.Init(context.Background())
	api.Init()
}
