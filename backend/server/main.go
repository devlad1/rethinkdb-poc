package main

import (
	"context"
	"server/queries"
	"server/socket"
)

func main() {

	ctx := context.Background()

	queries.Init(ctx)

	socket.Start()

}
