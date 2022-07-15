package entitygenerator

import (
	"fmt"
	"math/rand"
	"rethink-poc-server/rdbwriter"
	"rethink-poc-server/schemas"
	"time"
)

const (
	_MAX              int64   = 100 // number of entities
	_RATE             int64   = 10  // updates per second per entity
	_MIN_X_POS        float64 = -1000
	_MIN_X_VEL        float64 = -1.000
	_MAX_X_POS        float64 = 1000
	_MAX_X_VEL        float64 = 1.000
	_MIN_Y_POS        float64 = -1000
	_MIN_Y_VEL        float64 = -1.000
	_MAX_Y_POS        float64 = 1000
	_MAX_Y_VEL        float64 = 1.000
	_VEL_CHANGE_COEFF float64 = 0.1
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
	}
}

func generateRandomEntity() {
	shape := getRandomShape()
	color := getRandomColor()
	name := fmt.Sprintf("%s%s%d", shape, color, currId)

	newEntity := &schemas.Entity{
		Id:          currId,
		Name:        name,
		Color:       color,
		Shape:       shape,
		XCoordinate: float64(getRandomXPos()),
		YCoordinate: float64(getRandomYPos()),
		XVelocity:   getRandomXVel(),
		YVelocity:   getRandomYVel(),
	}

	entities = append(entities, newEntity)
	currId++

	rdbwriter.WriteEntity(newEntity)
}

func updateExistingEntity(entity *schemas.Entity) {
	entity.XCoordinate += entity.XVelocity
	entity.YCoordinate += entity.YVelocity
	entity.XVelocity += rand.Float64() - 0.5*_VEL_CHANGE_COEFF
	entity.YVelocity += rand.Float64() - 0.5*_VEL_CHANGE_COEFF
	rdbwriter.WriteEntity(entity)
}

func deleteEntity(i int) {
	entityToDelete := entities[i]
	newEntities := append(entities[0:i], entities[i+1:]...)
	entities = newEntities
	rdbwriter.DeleteEntity(entityToDelete)
}

func getRandomXPos() int {
	return rand.Intn(int(_MAX_X_POS-_MIN_X_POS)) + int(_MIN_X_POS)
}

func getRandomYPos() int {
	return rand.Intn(int(_MAX_Y_POS-_MIN_Y_POS)) + int(_MIN_Y_POS)
}

func getRandomXVel() float64 {
	return rand.Float64()*(_MAX_X_VEL-_MIN_X_VEL) + _MIN_X_VEL
}

func getRandomYVel() float64 {
	return rand.Float64()*(_MAX_Y_VEL-_MIN_Y_VEL) + _MIN_Y_VEL
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
