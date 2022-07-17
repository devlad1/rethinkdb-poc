package queries

import (
	"context"
	"log"
	"schemas"
)

type Stream struct {
	MessageCh chan schemas.Message
	Ctx       context.Context
	ctxCancel context.CancelFunc
}

func NewStream(ctx context.Context) Stream {
	ctx, cancel := context.WithCancel(ctx)
	return Stream{
		MessageCh: make(chan schemas.Message),
		Ctx:       ctx,
		ctxCancel: cancel,
	}
}

func (stream *Stream) Close() {
	log.Println("2 stream close")
	stream.ctxCancel()
}
