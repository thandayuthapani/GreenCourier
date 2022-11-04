package routes

import (
	"encoding/json"
	"github.com/thandayuthapani/metrics-collector/api"
	"net/http"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Valid Endpoint"))
}

func GetEmission(w http.ResponseWriter, r *http.Request) {
	jsonRes, err := json.Marshal(api.NormaliseMap(api.MOERMap))

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Error while marshalling json response"))
	}
	w.WriteHeader(http.StatusOK)
	w.Write(jsonRes)
}
