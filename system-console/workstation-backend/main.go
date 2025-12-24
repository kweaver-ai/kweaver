package main

import (
	"log"
)

func Main() {
	log.Println("Please use `./cmd/server` replace `main.go`")
	log.Println("Please use `./cmd/check` replace `main.go`")
	log.Fatalln("Execute `go run main.go` is not allowed")
}

func main() {
	// rel := database.GenerateBuiltinApps()
	// fmt.Println(len(rel))
	Main()
}
