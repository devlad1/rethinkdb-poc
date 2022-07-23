package queries

import (
	"context"
	"encoding/json"
	"log"
	"schemas"
	"server/utils"

	r "gopkg.in/rethinkdb/rethinkdb-go.v6"
)

const (
	dbName    = "db_poc"
	tableName = "table_poc"
)

var s *r.Session = nil
var globalCtx context.Context = nil
var globalCtxCancel context.CancelFunc = nil

type Point struct {
	Longitude float64
	Latitude  float64
}

func Init(parentCtx context.Context) {

	globalCtx, globalCtxCancel = context.WithCancel(parentCtx)

	session, err := r.Connect(r.ConnectOpts{
		Address: utils.GetenvWithDefault("RETHINKDB_HOST", "localhost"),
	})
	if err != nil {
		log.Fatalln(err)
	}

	s = session
}

func GetSingleEntity(ctx context.Context, id int) Stream {
	return createStream(ctx, r.
		DB(dbName).
		Table(tableName).
		Get(id).
		Changes(r.ChangesOpts{
			IncludeInitial: true,
		}))
}

func GetAllInPolygon(ctx context.Context, filter func(r.Term) r.Term, polygon []schemas.Point) Stream {
	rdbPoints := make([]interface{}, 0)
	for _, point := range polygon {
		rdbPoints = append(rdbPoints, r.Point(point.Longitude, point.Latitude))
	}

	query := r.
		DB(dbName).
		Table(tableName).
		GetIntersecting(r.Polygon(rdbPoints...), r.GetIntersectingOpts{Index: "location"})

	if filter != nil {
		query = query.Filter(filter)
	}

	return createStream(ctx, query.Changes(r.ChangesOpts{
		IncludeInitial: true,
		Squash:         true,
	}))
}

func GetAllInZoom(zoomCtx context.Context, filter func(r.Term) r.Term, zoom schemas.Zoom) Stream {
	return GetAllInPolygon(zoomCtx, filter, []schemas.Point{
		zoom.TopLeft,
		{Longitude: zoom.ButtomRight.Longitude, Latitude: zoom.TopLeft.Latitude},
		zoom.ButtomRight,
		{Longitude: zoom.TopLeft.Longitude, Latitude: zoom.ButtomRight.Latitude},
	})
}

func createStream(ctx context.Context, query r.Term) Stream {
	stream := NewStream(ctx)

	go func() {
		result, err := query.Run(s, r.RunOpts{Context: globalCtx})
		if err != nil {
			log.Fatal(err)
		}
		defer result.Close()

		go func() {
			<-stream.Ctx.Done()
			log.Println("3 query context close")
			result.Close()
		}()

		var dest map[string]interface{}
		for result.Next(&dest) {
			var err error
			var op schemas.Op
			var jsonString []byte
			switch {
			case dest["new_val"] == nil:
				op = schemas.Delete
				jsonString, err = json.Marshal(dest["old_val"])
			case dest["old_val"] == nil:
				op = schemas.Create
				jsonString, err = json.Marshal(dest["new_val"])
			default:
				op = schemas.Update
				jsonString, err = json.Marshal(dest["new_val"])
			}

			if err != nil {
				log.Fatal(err)
			}

			var entity schemas.Entity
			err = json.Unmarshal(jsonString, &entity)
			if err != nil {
				log.Fatal(err)
			}

			select {
			case stream.MessageCh <- schemas.Message{
				Entity: entity,
				Op:     op,
			}:
			case <-stream.Ctx.Done():
				log.Println("4 message channel close")
				return
			}
		}
	}()

	return stream
}
