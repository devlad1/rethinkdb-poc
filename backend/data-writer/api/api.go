package api

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"schemas"
	"strconv"
	"writer/entitygenerator"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func Init() {
	router := mux.NewRouter()
	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})

	router.HandleFunc("/start", startRandomGenerating)
	router.HandleFunc("/stop", stopRandomGenerating)
	router.HandleFunc("/entities", setNumberOfEntities)
	router.HandleFunc("/rate", setUpdateRate)
	router.HandleFunc("/send", sendN)
	router.HandleFunc("/clearall", clearAll)

	log.Fatal(http.ListenAndServe(":8079", handlers.CORS(originsOk, headersOk, methodsOk)(router)))
}

func startRandomGenerating(rw http.ResponseWriter, r *http.Request) {
	go entitygenerator.StartRandom()
	rw.WriteHeader(http.StatusOK)
	rw.Write(newResponse("200 - accepted"))
}

func stopRandomGenerating(rw http.ResponseWriter, r *http.Request) {
	err := entitygenerator.StopRandom()
	if err != nil {
		logAndSetError(err, rw)
	}
}

func sendN(rw http.ResponseWriter, r *http.Request) {
	queryValues := r.URL.Query()

	numberOfEntities, err := strconv.Atoi(queryValues.Get("n"))
	if err != nil {
		logAndSetError(err, rw)
		return
	}

	rawZoom, err := ioutil.ReadAll(r.Body)
	if err != nil {
		logAndSetError(err, rw)
		return
	}

	var zoom schemas.Zoom
	err = json.Unmarshal([]byte(rawZoom), &zoom)
	if err != nil {
		logAndSetError(err, rw)
		return
	}

	err = entitygenerator.SendNEntities(zoom, numberOfEntities)
	if err != nil {
		logAndSetError(err, rw)
		return
	}
}

func clearAll(rw http.ResponseWriter, r *http.Request) {
	err := entitygenerator.ClearAll()
	if err != nil {
		logAndSetError(err, rw)
		return
	}
}

func setNumberOfEntities(rw http.ResponseWriter, r *http.Request) {
	queryValues := r.URL.Query()
	newNumber, err := strconv.Atoi(queryValues.Get("n"))
	if err != nil {
		logAndSetError(err, rw)
		return
	}

	err = entitygenerator.SetNumberOfEntities(newNumber)
	if err != nil {
		logAndSetError(err, rw)
		return
	}
}

func setUpdateRate(rw http.ResponseWriter, r *http.Request) {
	queryValues := r.URL.Query()
	newRate, err := strconv.Atoi(queryValues.Get("n"))
	if err != nil {
		logAndSetError(err, rw)
		return
	}

	err = entitygenerator.SetUpdateRate(newRate)
	if err != nil {
		logAndSetError(err, rw)
		return
	}
}

func logAndSetError(err error, rw http.ResponseWriter) {
	log.Print(err)
	rw.WriteHeader(http.StatusBadRequest)
	rw.Write(newResponse(err.Error()))
}
