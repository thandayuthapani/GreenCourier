package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

var locations = []string{"northeurope", "eastus", "eastus2",
	"southcentralus", "westus2", "westus3", "australiaeast", "uksouth", "centralus",
	"northcentralus", "westus", "canadacentral", "westcentralus", "australiacentral",
	"australiasoutheast", "canadaeast", "ukwest", "australiacentral2"}

type CarbonSDKResponse struct {
	Location string
	Time     string
	Rating   float64
	Duration string
}

func GetEmissionFromCarbonSDK(location string) (string, float64) {
	var response []CarbonSDKResponse

	url := fmt.Sprintf("http://carbon-sdk.default.svc.cluster.local:80/emissions/bylocation?location=%s", location)
	method := "GET"

	client := &http.Client{}
	req, err := http.NewRequest(method, url, nil)

	if err != nil {
		fmt.Println(err)
		return "", 0
	}

	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return "", 0
	}
	defer res.Body.Close()
	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&response)
	if len(response) > 0 {
		return response[0].Location, response[0].Rating
	}
	return "", 0
}

func GetRealTimeEmissionsCarbonSDK() {
	for _, location := range locations {
		go func(region string) {
			resRegion, resValue := GetEmissionFromCarbonSDK(region)
			if resRegion == "" || resValue == 0 {
				fmt.Println("Error in response")
			} else {
				MOERMapLock.Lock()
				MOERMap[region] = resValue
				MOERMapLock.Unlock()
			}
		}(location)
	}
	fmt.Println(MOERMap)
}
