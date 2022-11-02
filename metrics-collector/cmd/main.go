package main

import (
	"flag"
	"github.com/gorilla/mux"
	"github.com/thandayuthapani/metrics-collector/api"
	"github.com/thandayuthapani/metrics-collector/cmd/config"
	"io"
	"net/http"
	"time"

	"github.com/thandayuthapani/metrics-collector/routes"
)

const CarbonSDKKey = "carbonSDK"

func main() {

	opt := config.NewServerOption()
	r := mux.NewRouter()

	opt.AddFlags(flag.CommandLine)
	opt.RegisterOptions()

	helloHandler := func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "Hello, world!\n")
	}

	r.HandleFunc("/", routes.HomeHandler)
	r.HandleFunc("/hello", helloHandler)
	r.HandleFunc("/getemission", routes.GetEmission)

	api.Login(opt)

	go func() {
		for {
			if opt.Source == CarbonSDKKey {
				api.GetRealTimeEmissionsCarbonSDK()
			} else {
				api.GetRealTimeEmissionsWatttime()
			}
			if opt.RefreshTime != 0 {
				time.Sleep(time.Duration(opt.RefreshTime) * time.Second)
			} else {
				time.Sleep(5 * time.Minute)
			}
		}
	}()

	http.ListenAndServe(":8080", r)
}
