package api

import "encoding/json"

type generatorResponse struct {
	Message string `json:"message"`
}

func newResponse(message string) []byte {
	res, _ := json.Marshal(generatorResponse{
		Message: message,
	})

	return res
}
