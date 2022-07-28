package entitygenerator

import (
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"
	"writer/rdbwriter"

	"schemas"

	r "gopkg.in/rethinkdb/rethinkdb-go.v6"
)

var (
	numberOfEntities = 200
	updateRate       = 3
	isRunning        = false
	lock             sync.Mutex
)

const (
	_MAX_NUMBER_OF_ENTITIES int     = 100000 // number of entities
	_MAX_UPDATE_RATE        int     = 1000   // updates per second per entity
	_MIN_LONGITUDE          float64 = -180.0
	_MIN_LONG_VEL           float64 = -1.000
	_MAX_LONGITUDE          float64 = 180.0
	_MAX_LONG_VEL           float64 = 1.000
	_MIN_LATITUDE           float64 = -90.0
	_MIN_LAT_VEL            float64 = -1.000
	_MAX_LATITUDE           float64 = 90.0
	_MAX_LAT_VEL            float64 = 1.000
	_VEL_CHANGE_COEFF       float64 = 0.05
)

var (
	entities []*schemas.Entity = make([]*schemas.Entity, 0)
	currId   int64             = 0
)

func SetNumberOfEntities(newNumberOfEntities int) {
	if newNumberOfEntities > _MAX_NUMBER_OF_ENTITIES {
		log.Printf("Tried to set number of entities to %d, when max is %d", newNumberOfEntities, _MAX_NUMBER_OF_ENTITIES)
		return
	}
	log.Printf("Set number of entities to %d", newNumberOfEntities)
	numberOfEntities = newNumberOfEntities
}

func SetUpdateRate(newRate int) {
	if newRate > _MAX_NUMBER_OF_ENTITIES {
		log.Printf("Tried to set update rate to %d, when max is %d", newRate, _MAX_UPDATE_RATE)
		return
	}
	log.Printf("Set update rate to %d", newRate)
	updateRate = newRate
}

func StartRandom() {
	if isRunning {
		log.Print("Tried to start when already running")
		return
	}

	lock.Lock()
	isRunning = true
	lock.Unlock()

	log.Print("Starting random generation")

	for i := 0; i < int(numberOfEntities); i++ {
		createRandomWorldEntity()
	}

	for isRunning {
		if len(entities) > int(float32(numberOfEntities)*1.1) {
			index := rand.Intn(len(entities))
			deleteEntity(index)
		} else if len(entities) < int(float32(numberOfEntities)*0.9) {
			createRandomWorldEntity()
		} else {
			actionSeed := rand.Intn(10)
			switch actionSeed {
			case 0:
				createRandomWorldEntity()
			case 1:
				index := rand.Intn(len(entities))
				deleteEntity(index)
			default:
				index := rand.Intn(len(entities))
				updateExistingEntity(entities[index])
			}
		}
		time.Sleep(time.Second / time.Duration(updateRate*numberOfEntities))
	}
}

func StopRandom() {
	lock.Lock()
	defer lock.Unlock()
	isRunning = false

	log.Print("Stopping random generation")
}

func SendNEntities(zoom schemas.Zoom, numberOfEntities int) {
	lock.Lock()
	defer lock.Unlock()

	if isRunning {
		log.Print("Can't send n entities while running random")
		return
	}

	log.Printf("Sending %d entities", numberOfEntities)

	entitiesToSend := make([]*schemas.Entity, numberOfEntities)
	for i := range entitiesToSend {
		entitiesToSend[i] = generateRandomEntity(zoom)
	}

	createEntities(entitiesToSend...)
}

func ClearAll() {
	lock.Lock()
	defer lock.Unlock()

	if isRunning {
		log.Print("Can't clear all whily random generation is running")
		return
	}

	log.Print("Clearing all...")
	if err := rdbwriter.DeleteAll(); err != nil {
		log.Fatal(err)
	}

	entities = make([]*schemas.Entity, 0)
}

func generateRandomEntity(zoom schemas.Zoom) *schemas.Entity {
	shape := getRandomShape()
	color := getRandomColor()
	name := fmt.Sprintf("%s%s%d", shape, color, currId)
	longitude := float64(getRandomXPos(zoom))
	latitude := float64(getRandomYPos(zoom))

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

	currId++

	fixValuesIfNeeded(newEntity)

	return newEntity
}

func updateExistingEntity(entity *schemas.Entity) {
	entity.Longitude += entity.LongV
	entity.Latitude += entity.LatV
	entity.LongV += (rand.Float64() - 0.5) * _VEL_CHANGE_COEFF
	entity.LatV += (rand.Float64() - 0.5) * _VEL_CHANGE_COEFF
	entity.Location = r.Point(entity.Longitude, entity.Latitude)

	fixValuesIfNeeded(entity)

	updateEntity(entity)
}

func createRandomWorldEntity() {
	entity := generateRandomEntity(schemas.Zoom{ButtomRight: schemas.Point{Longitude: _MAX_LONGITUDE, Latitude: -_MAX_LATITUDE}, TopLeft: schemas.Point{Longitude: -_MAX_LONGITUDE, Latitude: _MAX_LATITUDE}})

	createEntities(entity)
}

func createEntities(newEntities ...*schemas.Entity) {
	entities = append(entities, newEntities...)

	if err := rdbwriter.WriteEntity(newEntities...); err != nil {
		log.Fatal(err)
	}
}

func updateEntity(entity *schemas.Entity) {
	if err := rdbwriter.UpdateEntity(entity); err != nil {
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

func getRandomXPos(zoom schemas.Zoom) int {
	return rand.Intn(int(zoom.ButtomRight.Longitude-zoom.TopLeft.Longitude)) + int(zoom.TopLeft.Longitude)
}

func getRandomYPos(zoom schemas.Zoom) int {
	return rand.Intn(int(zoom.TopLeft.Latitude-zoom.ButtomRight.Latitude)) + int(zoom.ButtomRight.Latitude)
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
