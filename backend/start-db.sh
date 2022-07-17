#!/bin/bash

docker run -d -p 8080:8080 -p 28015:28015 --name rethinkdb --memory=500m --cpus=2 rethinkdb
