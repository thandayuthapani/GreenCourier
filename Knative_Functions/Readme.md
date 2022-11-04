## Usage
Simply login to the UI using the credentials provided on our project page. We already have a few functions deployed. You can simply invoke them. The current demo is running on GKE with Knative and GreenCourier.

## Function deployment  

For deploying new functions, follow the steps below:

1. Click on add FaaS function.
2. Give a name to your function.
3. Give a docker image url.
We have created a sample of 15 functions the docker urls for each of them can be found in [configuration](./configurations/). The demo currently assumes that the functions use gRPC for communication. So don't use the Atax-Java function since that uses 
HTTP/1.1.
4. Select the memory for you function.
5. Click on submit. 
6. Wait one minute.


## Function invocation
1. For a deployed function, simply click on invoke. You don't need to give any arguments. Leave them blank.

## Function results.
1. You can check the results of your functions by clicking on Results.