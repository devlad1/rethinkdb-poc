package api

import (
	"encoding/json"
	"time"
)

type generatorResponse struct {
	Message       string        `json:"message"`
	QueryDuration time.Duration `json:"queryduration,omitempty"`
}

func newResponse(message string, queryDuration time.Duration) []byte {
	res, _ := json.Marshal(generatorResponse{
		Message:       message,
		QueryDuration: queryDuration,
	})

	return res
}
