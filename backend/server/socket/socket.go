package socket

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"schemas"
	"server/queries"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"

	r "gopkg.in/rethinkdb/rethinkdb-go.v6"
)

var addr = flag.String("addr", ":8082", "http service address")
var upgrader = websocket.Upgrader{
	CheckOrigin: func(_ *http.Request) bool { return true },
}

func Start() {
	flag.Parse()
	http.HandleFunc("/zoom", streamEntitiesInZoom)
	http.HandleFunc("/polygon", streamEntitiesInPolygon)
	http.HandleFunc("/entity", getEntity)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

func genericRequest(w http.ResponseWriter, r *http.Request, stream queries.Stream) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer conn.Close()

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

func getEntity(w http.ResponseWriter, r *http.Request) {
	id, err := parseEntityIdFromRequest(r)
	if err != nil {
		log.Print("bad id:", err)
		return
	}

	stream := queries.GetSingleEntity(context.TODO(), id)

	genericRequest(w, r, stream)
}

func streamEntitiesInZoom(w http.ResponseWriter, r *http.Request) {
	zoom, filter, err := parseZoomFromRequest(r)
	if err != nil {
		log.Print("bad zoom:", err)
		return
	}

	stream := queries.GetAllInZoom(context.TODO(), filter, zoom)

	genericRequest(w, r, stream)
}

func streamEntitiesInPolygon(w http.ResponseWriter, r *http.Request) {
	polygon, filter, err := parsePolygonFromRequest(r)
	if err != nil {
		log.Print("bad polygon:", err)
		return
	}

	stream := queries.GetAllInPolygon(context.TODO(), filter, polygon)

	genericRequest(w, r, stream)
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

func parseEntityIdFromRequest(r *http.Request) (int, error) {
	queryKey := strings.Split(r.URL.RawQuery, "=")[0]
	if queryKey != "id" {
		return 0, fmt.Errorf("expected 'id', got %s", queryKey)
	}

	value := strings.Split(r.URL.RawQuery, "=")[1]

	parsedId, err := strconv.Atoi(value)
	if err != nil {
		return 0, err
	}

	log.Printf("get data for entity %d", parsedId)

	return parsedId, nil
}

func extractQueryMap(rawQuery string) map[string]string {
	keyValuePairs := strings.Split(rawQuery, "&")
	ret := make(map[string]string)
	for _, pair := range keyValuePairs {
		splitPair := strings.Split(pair, "=")
		ret[splitPair[0]] = splitPair[1]
	}
	return ret
}

func addFilterRecursively(fieldName string, values []string, row r.Term) r.Term {
	if len(values) == 1 {
		return row.Field(fieldName).Eq(values[0])
	}
	return row.Field(fieldName).Eq(values[0]).Or(addFilterRecursively(fieldName, values[1:], row))
}

func extractFilter(queryParams map[string]string) func(r.Term) r.Term {
	if _, ok := queryParams["colors"]; !ok {
		return nil
	}
	if _, ok := queryParams["shapes"]; !ok {
		return nil
	}
	if queryParams["colors"] == "" || queryParams["shapes"] == "" {
		return nil
	}

	colors := strings.Split(queryParams["colors"], ",")
	shapes := strings.Split(queryParams["shapes"], ",")

	return func(row r.Term) r.Term {
		return addFilterRecursively("color", colors, row).And(addFilterRecursively("shape", shapes, row))
	}
}

func parseZoomFromRequest(r *http.Request) (schemas.Zoom, func(r.Term) r.Term, error) {

	queryParams := extractQueryMap(strings.ReplaceAll(r.URL.RawQuery, "%22", "\""))
	// for k, v := range queryParams {
	// 	log.Printf("%s: %s", k, v)
	// }

	if _, ok := queryParams["zoom"]; !ok {
		return schemas.Zoom{}, nil, fmt.Errorf("zoom request query didn't contain zoom")
	}

	var parsedZoom schemas.Zoom
	err := json.Unmarshal([]byte(queryParams["zoom"]), &parsedZoom)
	if err != nil {
		return schemas.Zoom{}, nil, err
	}

	log.Printf("getting entities in zoom %+v", parsedZoom)

	return parsedZoom, extractFilter(queryParams), nil
}

func parsePolygonFromRequest(r *http.Request) ([]schemas.Point, func(r.Term) r.Term, error) {

	queryParams := extractQueryMap(strings.ReplaceAll(r.URL.RawQuery, "%22", "\""))

	if _, ok := queryParams["polygon"]; !ok {
		return nil, nil, fmt.Errorf("polygon request query didn't contain polygon")
	}

	var parsedPolygon []schemas.Point
	err := json.Unmarshal([]byte(queryParams["polygon"]), &parsedPolygon)
	if err != nil {
		return nil, nil, err
	}

	log.Printf("getting entities in polygon %+v", parsedPolygon)

	return parsedPolygon, extractFilter(queryParams), nil
}
