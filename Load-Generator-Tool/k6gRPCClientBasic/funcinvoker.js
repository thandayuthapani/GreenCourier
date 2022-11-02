import grpc from 'k6/net/grpc';
import { check, sleep } from 'k6';
const client = new grpc.Client();

client.load(['./'], 'faasfunc.proto');

export const options = {
  vus: `${__ENV.NUM_VUS}`,
  duration: '600s',
};


export default () => {
   
  client.connect(`${__ENV.SERVICE_URL}`, {
      plaintext: true
    });

   
    const data = { name: `${__ENV.FUNCTION_NAME}` };
    const response = client.invoke('Funcbench.FaaSFunc/InvokeFunc', data);


    check(response, {
      'status is OK': (r) => r && r.status === grpc.StatusOK,
    });
  
    console.log(JSON.stringify(response.message));
  
    client.close();
    // sleep(1);
  };