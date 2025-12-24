package main

import (
	"fmt"
	"os"
	"system-backend/cmd/initdb"
	"system-backend/cmd/server"
)

func help(cmd string) {
	fmt.Printf("Usage: %s <command>\n", cmd)
	fmt.Println("Available commands:")
	fmt.Println("  server - Start the server")
	fmt.Println("  initdb - Initialize the database")
}

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		help(os.Args[0])
		os.Exit(1)
	}

	switch args[0] {
	case "server":
		server.Main()
	case "initdb":
		initdb.Main()
	default:
		help(os.Args[0])
		os.Exit(1)
	}
}
