package schemas

import r "gopkg.in/rethinkdb/rethinkdb-go.v6"

type Entity struct {
	Id        int64   `json:"id"`
	Name      string  `json:"name"`
	Color     Color   `json:"color"`
	Shape     Shape   `json:"shape"`
	Longitude float64 `json:"longitude"`
	Latitude  float64 `json:"latitude"`
	LongV     float64 `json:"longV"`
	LatV      float64 `json:"latV"`
	Location  r.Term  `json:"location"`
}
