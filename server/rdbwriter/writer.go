package rdbwriter

import (
	"context"
	"log"

	r "gopkg.in/rethinkdb/rethinkdb-go.v6"

	"rethink-poc-server/schemas"
)

const (
	dbName    = "db_poc"
	tableName = "table_poc"
)

var s *r.Session = nil
var ctx context.Context = nil
var ctxCancel context.CancelFunc = nil

func Init(parentCtx context.Context) {
	ctx, ctxCancel = context.WithCancel(parentCtx)

	r.SetTags("rethinkdb", "json")

	initSession()
	initDb()
	initTable()
}

func WriteEntity(entity *schemas.Entity) error {
	_, err := r.
		DB(dbName).
		Table(tableName).
		Insert(entity, r.InsertOpts{
			Conflict: func(_, _, newDoc r.Term) interface{} {
				return newDoc
			},
		}).
		RunWrite(s, r.RunOpts{Context: ctx})
	return err
}

func DeleteEntity(entity *schemas.Entity) error {
	_, err := r.
		DB(dbName).
		Table(tableName).
		Get(entity.Id).
		Delete().
		RunWrite(s, r.RunOpts{Context: ctx})
	return err
}

func initSession() {
	session, err := r.Connect(r.ConnectOpts{
		Address: "localhost", // endpoint without http
	})
	if err != nil {
		log.Fatalln(err)
	}

	s = session
}

func initDb() {
	result, err := r.DBList().
		Contains(dbName).
		Run(s, r.RunOpts{Context: ctx})
	if err != nil {
		log.Fatalln(err)
	}

	var response interface{}
	result.One(&response)
	if err != nil {
		log.Fatalln(err)
	}

	if response == false {
		r.DBCreate(dbName).RunWrite(s, r.RunOpts{Context: ctx})
		if err != nil {
			log.Fatalln(err)
		}
	}
	s.Use(dbName)
}

func initTable() {
	var err error
	r.TableCreate(tableName).RunWrite(s, r.RunOpts{Context: ctx})
	if err != nil {
		log.Fatalln(err)
	}
}
