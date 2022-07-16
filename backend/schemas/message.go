package schemas

type Message struct {
	Op     Op     `json:"op"`
	Entity Entity `json:"entity"`
}
