package api

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"sync"
)

const responseStyle = "moer"
const maxScore = 100

var balancingAuthorities = []string{"AT", "BE", "CZ", "DE", "DK", "EE", "ES",
	"FI", "FR", "GR", "HU", "IE", "IT", "LT", "LV", "NL",
	"NO", "PL", "PT", "RO", "RS", "SE", "SI", "SK", "UK"}

type WattTimeResponse struct {
	BA   string
	Freq string
	MOER string
	Time string
}

var MOERMap = map[string]float64{}
var MOERMapLock = sync.RWMutex{}

func GetEmission(ba string, style string) (string, string) {
	if style == "" {
		style = "all"
	}

	var structResponse WattTimeResponse

	auth := GetToken()

	url := fmt.Sprintf("https://api2.watttime.org/v2/index?ba=%s&style=%s", ba, style)
	method := "GET"

	client := &http.Client{}
	req, err := http.NewRequest(method, url, nil)

	if err != nil {
		fmt.Println(err)
		return "", ""
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", auth))

	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return "", ""
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&structResponse)
	//fmt.Println(structResponse.MOER, structResponse.BA)
	return structResponse.MOER, structResponse.BA
}

func GetRealTimeEmissionsWatttime() {
	for _, ba := range balancingAuthorities {
		go func(balanceAuth string) {
			resMOER, resBA := GetEmission(balanceAuth, responseStyle)
			if resMOER == "" || resBA == "" {
				fmt.Println("Error in response")
			} else {
				moerFloat, err := strconv.ParseFloat(resMOER, 64)
				if err != nil {
					fmt.Println(err)

				} else {
					MOERMapLock.Lock()
					MOERMap[resBA] = moerFloat
					MOERMapLock.Unlock()
				}
			}
		}(ba)
	}
	fmt.Println(MOERMap)
}

func NormaliseMap(emissionMap map[string]float64) map[string]float64 {
	var normalisedMap = map[string]float64{}
	var minValue = float64(9999)
	var maxValue = float64(0)
	for _, value := range emissionMap {
		if value < minValue {
			minValue = value
		}
		if value > maxValue {
			maxValue = value
		}
	}
	for key, value := range emissionMap {
		normalisedMap[key] = normalise(value, minValue, maxValue)
	}
	return normalisedMap
}

func normalise(value, minValue, maxValue float64) float64 {
	num := value - minValue
	denom := maxValue - minValue
	var result = num / denom
	//fmt.Println(result)
	return maxScore - math.Round(result*maxScore)
}
