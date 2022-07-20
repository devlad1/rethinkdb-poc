package api

import (
	"log"
	"net/http"
	"strconv"
	"writer/entitygenerator"
)

func Init() {
	http.HandleFunc("/entities", setNumberOfEntities)
	http.HandleFunc("/rate", setUpdateRate)

	log.Fatal(http.ListenAndServe(":8080", nil))
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
