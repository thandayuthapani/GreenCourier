![GreenCourier](/Images/GreenCourier-Name.png "GreenCourier")  

GreenCourier is a carbon-aware Kubernetes plugin to intelligently schedule
serverless functions in regions of low carbon emission using [Carbon-Aware-SDK](https://github.com/Green-Software-Foundation/carbon-aware-sdk).
GreenCourier optimises delivery of serverless functions across geo-spatial multi-cluster Kubernetes environment in the cloud for carbon efficiency.
GreenCourier has production-ready tech stack and one-click away from integrating
with existing geographically distributed clusters with Liqo.  
## System Architecture  

![System Architecture](/Images/system-architecture.png "GreenCourier Architecture")  

## Installation
We need a cluster with Knative enabled in management cluster and target clusters which are
geographically distributed to be connected to management cluster using [Liqo](https://github.com/liqotech/liqo).  

Once the cluster setup up is done, it is important for us to install metrics-collector and Carbon-Aware-SDK's WebAPI in local cluster.

```
# Replace $USERNAME and $PASSWORD with WattTime credentials in deployment YAML
kubectl apply -f metrics-collector/deployment/deployment.yaml
```
Once metrics-collector is deployed, we can deploy the plugin code using [Helm](https://helm.sh/) using following command:
```
helm install GreenCourier carbon-scheduler/charts/
```
When metrics-collector and plugin code is deployed, we can just start deploying functions in Knative
with just addition of one line in the function spec YAML.
```
...
spec:
  schedulerName: kube-carbon-scheduler
...
```
Example function spec with schedulerName added.
```
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: hello
  namespace: default
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/target: "10"
    spec:
      schedulerName: kube-carbon-scheduler
      containers:
        - image: gcr.io/knative-samples/helloworld-go
          ports:
            - containerPort: 8080
          env:
            - name: TARGET
              value: "GreenCourier Demo"
```
## Evaluation
As shown in the system architecture, we deployed 3 clusters in different regions and load tested our solution.
And the result of the evaluation is show as following:  

![EvalResult](/Images/Evaluation-Result.jpg "Evaluation Result")

It is very much evident that our proposed solution does impact scheduling decisions, tremendously reducing carbon
footprint for function execution.  We calculate efficiency value for function placement by following formula:

$$
Placement Efficiency = \frac{number\ of\ function\ instances\ deployed\ in\ possible\ carbon\ efficient\ region}{total\ number\ of\ function\ instances\ executed}
$$

Similarly, Carbon efficiency was calculated by taking weighted average of carbon score divided by best possible
result for execution.

$$
Carbon Efficiency = \frac{\Sigma number\ of\ function\ instances\ deployed\ in\ a\ region \times Carbon\ score\ of\ that\ region}{Best\ possible\ score\ for\ the\ given\ workload}
$$

## Extending GreenCourier
GreenCourier is built using [Kubernetes Scheduling Framework](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/).
It is possible to extend GreenCourier just as extending [Kubernetes Scheduler](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/) for which there are numerous 
publicly available documentation.  

## References
1. [Immersion cooling heats up - Greengard, Samuel](https://dl.acm.org/doi/abs/10.1145/3530688)
2. [Serverless in the Wild: Characterizing and Optimizing the Serverless Workload at a Large Cloud Provider](https://www.usenix.org/conference/atc20/presentation/shahrad)
3. [How much energy do data centers use?](https://davidmytton.blog/how-much-energy-do-data-centers-use/)
4. [Global Serverless Architecture Market To Reach USD 86.94 Billion By 2030](https://www.reportsanddata.com/press-release/global-serverless-architecture-market)

## Contact
Thandayuthapani Subramanian [:e-mail:](thandayuthapani.subramanian@tum.de) [![Linkedin](https://i.stack.imgur.com/gVE0j.png)](https://www.linkedin.com/in/thandayuthapani/) [![GitHub](https://i.stack.imgur.com/tskMh.png)](https://github.com/thandayuthapani)  
Mohak Chadha [:e-mail:](mohak.chadha@tum.de)[![Linkedin](https://i.stack.imgur.com/gVE0j.png)](https://www.linkedin.com/in/mohak-chadha-1490707b) [![GitHub](https://i.stack.imgur.com/tskMh.png)](https://github.com/kky-fury)