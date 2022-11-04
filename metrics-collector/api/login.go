package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/thandayuthapani/metrics-collector/cmd/config"
)

type Auth struct {
	Token string
}

var auth Auth

func Login(opt *config.ServerOption) error {

	url := "https://api2.watttime.org/v2/login"
	method := "GET"

	client := &http.Client{}
	req, err := http.NewRequest(method, url, nil)

	if err != nil {
		fmt.Println(err)
		return err
	}
	req.SetBasicAuth(opt.Username, opt.Password)

	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&auth)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func GetToken() string {
	return auth.Token
}
