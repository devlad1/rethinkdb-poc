package rdbwriter

import (
	"context"
	"log"
	"os"

	r "gopkg.in/rethinkdb/rethinkdb-go.v6"

	"schemas"
)

const (
	dbName    = "db_poc"
	tableName = "table_poc"
	indexName = "location"
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
	initIndex()
}

func WriteEntity(entities ...*schemas.Entity) error {
	return r.
		DB(dbName).
		Table(tableName).
		Insert(entities).
		Exec(s, r.ExecOpts{Context: ctx, NoReply: true})
}

func UpdateEntity(entity *schemas.Entity) error {
	return r.
		DB(dbName).
		Table(tableName).
		Get(entity.Id).
		Update(entity).
		Exec(s, r.ExecOpts{Context: ctx, NoReply: true})
}

func DeleteEntity(id int) error {
	return r.
		DB(dbName).
		Table(tableName).
		Get(id).
		Delete().
		Exec(s, r.ExecOpts{Context: ctx, NoReply: true})
}

func DeleteAll() error {
	err := r.
		DB(dbName).
		Table(tableName).
		Delete().
		Exec(s, r.ExecOpts{Context: ctx, NoReply: true})
	return err
}

func initSession() {
	session, err := r.Connect(r.ConnectOpts{
		Address: getenv("RETHINKDB_HOST", "localhost"),
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
	err = result.One(&response)
	if err != nil {
		log.Fatalln(err)
	}

	if response == false {
		_, err = r.DBCreate(dbName).RunWrite(s, r.RunOpts{Context: ctx})
		if err != nil {
			log.Fatalln(err)
		}
	}
	s.Use(dbName)
}

func initTable() {
	var err error

	result, err := r.TableList().Contains(tableName).Run(s, r.RunOpts{Context: ctx})
	if err != nil {
		log.Fatalln(err)
	}

	var response interface{}
	err = result.One(&response)
	if err != nil {
		log.Fatalln(err)
	}

	if response == false {
		_, err = r.TableCreate(tableName).RunWrite(s, r.RunOpts{Context: ctx})
		if err != nil {
			log.Fatalln(err)
		}
	}
}

func initIndex() {
	var err error

	result, err := r.Table(tableName).IndexList().Contains(indexName).Run(s, r.RunOpts{Context: ctx})
	if err != nil {
		log.Fatalln(err)
	}

	var response interface{}
	err = result.One(&response)
	if err != nil {
		log.Fatalln(err)
	}

	if response == false {
		_, err = r.Table(tableName).IndexCreate(indexName, r.IndexCreateOpts{
			Geo: true,
		}).RunWrite(s, r.RunOpts{Context: ctx})
		if err != nil {
			log.Fatalln(err)
		}
	}
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return fallback
	}
	return value
}
