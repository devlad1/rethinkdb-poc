package schemas

type Entity struct {
	Id          int64   `json:"id"`
	Name        string  `json:"name"`
	Color       Color   `json:"color"`
	Shape       Shape   `json:"color"`
	XCoordinate float64 `json:"xCoordinate"`
	YCoordinate float64 `json:"yCoordinate"`
	XVelocity   float64 `json:"xVelocity"`
	YVelocity   float64 `json:"yVelocity"`
}
