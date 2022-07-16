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
var ctx context.Context = nil
var ctxCancel context.CancelFunc = nil

type Point struct {
	Longitude float64
	Latitude  float64
}

func Init(parentCtx context.Context) {

	ctx, ctxCancel = context.WithCancel(parentCtx)

	session, err := r.Connect(r.ConnectOpts{
		Address: utils.GetenvWithDefault("RETHINKDB_HOST", "localhost"),
	})
	if err != nil {
		log.Fatalln(err)
	}

	s = session

}

func GetAllInZoom(zoom schemas.Zoom) chan schemas.Message {

	rdbPoints := make([]interface{}, 4)
	rdbPoints[0] = r.Point(zoom.TopLeft.Longitude, zoom.TopLeft.Latitude)
	rdbPoints[1] = r.Point(zoom.ButtomRight.Longitude, zoom.TopLeft.Latitude)
	rdbPoints[2] = r.Point(zoom.ButtomRight.Longitude, zoom.ButtomRight.Latitude)
	rdbPoints[3] = r.Point(zoom.TopLeft.Longitude, zoom.ButtomRight.Latitude)

	messagesCh := make(chan schemas.Message)

	go func() {
		for {
			result, err := r.
				DB(dbName).
				Table(tableName).
				GetIntersecting(r.Polygon(rdbPoints...), r.GetIntersectingOpts{Index: "location"}).
				Changes(r.ChangesOpts{IncludeInitial: false}).
				Run(s, r.RunOpts{Context: ctx})
			if err != nil {
				log.Fatal(err)
			}

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

				messagesCh <- schemas.Message{
					Entity: entity,
					Op:     op,
				}
			}
		}
	}()

	return messagesCh
}
