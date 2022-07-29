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
	_MAX_NUMBER_OF_ENTITIES int     = 50000 // number of entities
	_MAX_UPDATE_RATE        int     = 100   // updates per second per entity
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

func SetNumberOfEntities(newNumberOfEntities int) error {
	if newNumberOfEntities > _MAX_NUMBER_OF_ENTITIES {
		return fmt.Errorf("tried to set number of entities to %d, when max is %d", newNumberOfEntities, _MAX_NUMBER_OF_ENTITIES)
	}

	if newNumberOfEntities == 0 {
		return fmt.Errorf("tried to set number of entities to 0")
	}

	log.Printf("Set number of entities to %d", newNumberOfEntities)
	numberOfEntities = newNumberOfEntities
	return nil
}

func SetUpdateRate(newRate int) error {
	if newRate > _MAX_NUMBER_OF_ENTITIES {
		return fmt.Errorf("tried to set update rate to %d, when max is %d", newRate, _MAX_UPDATE_RATE)
	}

	if newRate == 0 {
		return fmt.Errorf("tried to set update rate to 0")
	}

	log.Printf("Set update rate to %d", newRate)
	updateRate = newRate
	return nil
}

func StartRandom() {
	if isRunning {
		log.Print("tried to start when already running")
		return
	}

	lock.Lock()
	isRunning = true
	lock.Unlock()

	log.Print("starting random generation")

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
				if len(entities) > 0 {
					index := rand.Intn(len(entities))
					deleteEntity(index)
				}
			default:
				if len(entities) > 0 {
					index := rand.Intn(len(entities))
					updateExistingEntity(entities[index])
				}
			}
		}
		time.Sleep(time.Second / time.Duration(updateRate*numberOfEntities))
	}
}

func StopRandom() error {
	lock.Lock()
	defer lock.Unlock()

	if !isRunning {
		return fmt.Errorf("tried to stop random generation when not running")
	}

	isRunning = false

	log.Print("stopping random generation")
	return nil
}

func SendNEntities(zoom schemas.Zoom, numberOfEntities int) error {
	lock.Lock()
	defer lock.Unlock()

	if isRunning {
		return fmt.Errorf("can't send n entities while running random")
	}

	if numberOfEntities > _MAX_NUMBER_OF_ENTITIES {
		return fmt.Errorf("can't send %d entities because it's greater than the maximum %d", numberOfEntities, _MAX_NUMBER_OF_ENTITIES)
	}

	log.Printf("sending %d entities", numberOfEntities)

	entitiesToSend := make([]*schemas.Entity, numberOfEntities)
	for i := range entitiesToSend {
		entitiesToSend[i] = generateRandomEntity(zoom)
	}

	createEntities(entitiesToSend...)
	return nil
}

func ClearAll() error {
	lock.Lock()
	defer lock.Unlock()

	if isRunning {
		return fmt.Errorf("can't clear all while random generation is running")
	}

	log.Print("clearing all...")
	if err := rdbwriter.DeleteAll(); err != nil {
		log.Fatal(err)
	}

	entities = make([]*schemas.Entity, 0)
	return nil
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
