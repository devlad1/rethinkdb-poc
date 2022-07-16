package main

import (
	"context"
	"server/queries"
	"server/socket"
)

func main() {

	ctx := context.Background()

	queries.Init(ctx)
	// ch := queries.GetAllInPolygon(queries.Point{Longitude: 0, Latitude: 0},
	// 	queries.Point{Longitude: -10, Latitude: 10},
	// 	queries.Point{Longitude: 10, Latitude: 10},
	// 	queries.Point{Longitude: 10, Latitude: -10},
	// 	queries.Point{Longitude: -10, Latitude: -10})

	// for m := range ch {
	// 	log.Print(m)
	// }

	socket.Start()

}
