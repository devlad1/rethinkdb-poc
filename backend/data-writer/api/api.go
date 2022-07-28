package api

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"schemas"
	"strconv"
	"writer/entitygenerator"
)

func Init() {
	http.HandleFunc("/start", startRandomGenerating)
	http.HandleFunc("/stop", stopRandomGenerating)
	http.HandleFunc("/send", sendN)
	http.HandleFunc("/clearall", clearAll)
	http.HandleFunc("/entities", setNumberOfEntities)
	http.HandleFunc("/rate", setUpdateRate)

	log.Fatal(http.ListenAndServe(":8079", nil))
}

func startRandomGenerating(rw http.ResponseWriter, r *http.Request) {
	go entitygenerator.StartRandom()
}

func stopRandomGenerating(rw http.ResponseWriter, r *http.Request) {
	entitygenerator.StopRandom()
}

func sendN(rw http.ResponseWriter, r *http.Request) {
	queryValues := r.URL.Query()

	numberOfEntities, err := strconv.Atoi(queryValues.Get("n"))
	if err != nil {
		log.Print(err)
		return
	}

	rawZoom, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Print(err)
		return
	}

	var zoom schemas.Zoom
	err = json.Unmarshal([]byte(rawZoom), &zoom)
	if err != nil {
		log.Print(err)
		return
	}

	entitygenerator.SendNEntities(zoom, numberOfEntities)
}

func clearAll(rw http.ResponseWriter, r *http.Request) {
	entitygenerator.ClearAll()
}

func setNumberOfEntities(rw http.ResponseWriter, r *http.Request) {
	queryValues := r.URL.Query()
	newNumber, err := strconv.Atoi(queryValues.Get("n"))
	if err != nil {
		log.Print(err)
		return
	}

	entitygenerator.SetNumberOfEntities(newNumber)
}

func setUpdateRate(rw http.ResponseWriter, r *http.Request) {
	queryValues := r.URL.Query()
	newRate, err := strconv.Atoi(queryValues.Get("n"))
	if err != nil {
		log.Print(err)
		return
	}

	entitygenerator.SetUpdateRate(newRate)
}
