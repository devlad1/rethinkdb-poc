package socket

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"schemas"
	"server/queries"
	"server/utils"
	"strings"

	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", utils.GetenvWithDefault("SERVER_HOST", "localhost:8082"), "http service address")
var upgrader = websocket.Upgrader{
	CheckOrigin: func(_ *http.Request) bool { return true },
}

func Start() {
	flag.Parse()
	http.HandleFunc("/zoom", streamEntitiesInZoom)
	http.HandleFunc("/polygon", streamEntitiesInPolygon)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

func streamEntitiesInZoom(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer conn.Close()

	zoom, err := parseZoomFromRequest(r)
	if err != nil {
		log.Print("bad zoom:", err)
		return
	}

	stream := queries.GetAllInZoom(context.TODO(), zoom)

	conn.SetCloseHandler(func(code int, text string) error {
		log.Println("1 ws close socket handler")
		stream.Close()
		return nil
	})
	go readClose(conn)

	for m := range stream.MessageCh {
		err = conn.WriteJSON(m)
		if err != nil {
			log.Printf("stopping send, got error '%s'", err)
			return
		}
	}
}

func streamEntitiesInPolygon(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer conn.Close()

	polygon, err := parsePolygonFromRequest(r)
	if err != nil {
		log.Print("bad polygon:", err)
		return
	}

	stream := queries.GetAllInPolygon(context.TODO(), polygon)

	conn.SetCloseHandler(func(code int, text string) error {
		log.Println("1 ws close socket handler")
		stream.Close()
		return nil
	})
	go readClose(conn)

	for m := range stream.MessageCh {
		err = conn.WriteJSON(m)
		if err != nil {
			log.Printf("stopping send, got error '%s'", err)
			return
		}
	}
}

func readClose(conn *websocket.Conn) {
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err) {
				return
			}
			log.Printf("got error on read '%s'", err)
		}
	}
}

func parseZoomFromRequest(r *http.Request) (schemas.Zoom, error) {

	rawObj := strings.Split(r.URL.RawQuery, "=")[1]
	rawObj = strings.ReplaceAll(rawObj, "%22", "\"")

	var parsedZoom schemas.Zoom
	err := json.Unmarshal([]byte(rawObj), &parsedZoom)
	if err != nil {
		return schemas.Zoom{}, err
	}

	return parsedZoom, nil
}

func parsePolygonFromRequest(r *http.Request) ([]schemas.Point, error) {

	rawObj := strings.Split(r.URL.RawQuery, "=")[1]
	rawObj = strings.ReplaceAll(rawObj, "%22", "\"")

	var parsedPolygon []schemas.Point
	err := json.Unmarshal([]byte(rawObj), &parsedPolygon)
	if err != nil {
		return nil, err
	}

	return parsedPolygon, nil
}
