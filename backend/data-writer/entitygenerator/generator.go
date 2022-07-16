package entitygenerator

import (
	"fmt"
	"log"
	"math/rand"
	"time"
	"writer/rdbwriter"

	"schemas"

	r "gopkg.in/rethinkdb/rethinkdb-go.v6"
)

const (
	_MAX              int64   = 100 // number of entities
	_RATE             int64   = 10  // updates per second per entity
	_MIN_LONGITUDE    float64 = -180.0
	_MIN_LONG_VEL     float64 = -1.000
	_MAX_LONGITUDE    float64 = 180.0
	_MAX_LONG_VEL     float64 = 1.000
	_MIN_LATITUDE     float64 = -90.0
	_MIN_LAT_VEL      float64 = -1.000
	_MAX_LATITUDE     float64 = 90.0
	_MAX_LAT_VEL      float64 = 1.000
	_VEL_CHANGE_COEFF float64 = 0.05
)

var (
	entities []*schemas.Entity = make([]*schemas.Entity, 0)
	currId   int64             = 0
)

func Start() {
	for i := 0; i < int(_MAX); i++ {
		generateRandomEntity()
	}

	for {
		if len(entities) > 10 {
			actionSeed := rand.Intn(10)
			switch actionSeed {
			case 0:
				generateRandomEntity()
			case 1:
				index := rand.Intn(len(entities))
				deleteEntity(index)
			default:
				index := rand.Intn(len(entities))
				updateExistingEntity(entities[index])
			}
			time.Sleep(time.Second / time.Duration(_RATE*_MAX))
		} else {
			generateRandomEntity()
		}
	}
}

func generateRandomEntity() {
	shape := getRandomShape()
	color := getRandomColor()
	name := fmt.Sprintf("%s%s%d", shape, color, currId)
	longitude := float64(getRandomXPos())
	latitude := float64(getRandomYPos())

	newEntity := &schemas.Entity{
		Id:        currId,
		Name:      name,
		Color:     color,
		Shape:     shape,
		Longitude: longitude,
		Latitude:  latitude,
		LongV:     getRandomXVel(),
		LatV:      getRandomYVel(),
		Location:  r.Point(longitude, latitude),
	}

	fixValuesIfNeeded(newEntity)

	entities = append(entities, newEntity)
	currId++

	if err := rdbwriter.WriteEntity(newEntity); err != nil {
		log.Fatal(err)
	}
}

func updateExistingEntity(entity *schemas.Entity) {
	entity.Longitude += entity.LongV
	entity.Latitude += entity.LatV
	entity.LongV += (rand.Float64() - 0.5) * _VEL_CHANGE_COEFF
	entity.LatV += (rand.Float64() - 0.5) * _VEL_CHANGE_COEFF
	entity.Location = r.Point(entity.Longitude, entity.Latitude)

	fixValuesIfNeeded(entity)

	if err := rdbwriter.WriteEntity(entity); err != nil {
		log.Fatal(err)
	}
}

func deleteEntity(i int) {
	entityToDelete := entities[i]
	newEntities := append(entities[0:i], entities[i+1:]...)
	entities = newEntities

	if err := rdbwriter.DeleteEntity(int(entityToDelete.Id)); err != nil {
		log.Fatal(err)
	}
}

func fixValuesIfNeeded(entity *schemas.Entity) {
	longitudeRange := _MAX_LONGITUDE - _MIN_LONGITUDE
	latitudeRange := _MAX_LATITUDE - _MIN_LATITUDE

	for entity.Latitude > _MAX_LATITUDE {
		entity.Latitude -= latitudeRange
	}
	for entity.Latitude < _MIN_LATITUDE {
		entity.Latitude += latitudeRange
	}
	for entity.Longitude > _MAX_LONGITUDE {
		entity.Longitude -= longitudeRange
	}
	for entity.Longitude < _MIN_LONGITUDE {
		entity.Longitude += longitudeRange
	}

	entity.Location = r.Point(entity.Longitude, entity.Latitude)
}

func getRandomXPos() int {
	return rand.Intn(int(_MAX_LONGITUDE-_MIN_LONGITUDE)) + int(_MIN_LONGITUDE)
}

func getRandomYPos() int {
	return rand.Intn(int(_MAX_LATITUDE-_MIN_LATITUDE)) + int(_MIN_LATITUDE)
}

func getRandomXVel() float64 {
	return rand.Float64()*(_MAX_LONG_VEL-_MIN_LONG_VEL) + _MIN_LONG_VEL
}

func getRandomYVel() float64 {
	return rand.Float64()*(_MAX_LAT_VEL-_MIN_LAT_VEL) + _MIN_LAT_VEL
}

func getRandomShape() schemas.Shape {
	shapeSeed := rand.Intn(2)
	switch shapeSeed {
	case 0:
		return schemas.Circle
	case 1:
		return schemas.Square
	default:
		panic("bad random val")
	}
}

func getRandomColor() schemas.Color {
	colorSeed := rand.Intn(4)
	switch colorSeed {
	case 0:
		return schemas.Black
	case 1:
		return schemas.Red
	case 2:
		return schemas.Green
	case 3:
		return schemas.Blue
	default:
		panic("bad random val")
	}
}
