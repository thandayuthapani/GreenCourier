import grpc from 'k6/net/grpc';
import { check, sleep } from "k6";
const client = new grpc.Client();

client.load(['./'], 'faasfunc.proto');

export function invokeFaaSfunction(function_url, function_name) {
    
    client.connect(function_url, {
        plaintext: true
    });

    const data = { name: function_name };
    const response = client.invoke('Funcbench.FaaSFunc/InvokeFunc', data);

    check(response, {
        'status is OK': (r) => r && r.status === grpc.StatusOK,
    });

    console.log(JSON.stringify(response.message));
    client.close();
    sleep(.300);
}

export default {invokeFaaSfunction}