package schemas

type Point struct {
	Longitude float64
	Latitude  float64
}

type Zoom struct {
	TopLeft     Point
	ButtomRight Point
}
