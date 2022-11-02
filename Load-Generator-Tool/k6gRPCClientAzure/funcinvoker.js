import http from 'k6/http';
import { check, sleep } from "k6";
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import {
    SharedArray
} from "k6/data";

const funcData = new SharedArray("another data name", function () {
    return papaparse.parse(open('./data/dataset3.csv')).data;
});
import { invokeFaaSfunction } from './fetchData.js'

//NOTE: 1 VU - approax 50 req in 30s
const makeScenarios = function () {
    let scenarios = {}
    //data: days - 14, perday - 24hrs
    //NOTE: Currently we are replicating requests for a single function for 15 min
    for (let i = 1; i < funcData.length / (14 * 24 * 2 * 2); i++) {
        let timer = 60 * i
        let customTime = timer + "s"
        if (funcData[i][0] > 0) {
            scenarios['scenario' + i] = {
                executor: 'shared-iterations',
                startTime: customTime,
                vus: Math.ceil(funcData[i][0] / 50),
                iterations: funcData[i][0],
                exec: 'S01_FetchData',
                maxDuration: '60s',
            }
        }
    }
    return scenarios
}

export const options = {
    scenarios: makeScenarios()
}

export function S01_FetchData() {
    invokeFaaSfunction(`${__ENV.SERVICE_URL}`, `${__ENV.FUNCTION_NAME}`);
}
