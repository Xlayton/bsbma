package main

import (
	"net/http"

	spa "github.com/roberthodgen/spa-server"
)

func main() {
	http.Handle("/", spa.SpaHandler("../build", "index.html"))
	http.ListenAndServe(":3000", nil)
}
