package carbon

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/klog/v2"
	"k8s.io/kubernetes/pkg/scheduler/framework"
)

var _ framework.ScorePlugin = &Plugin{}

type Plugin struct {
	handle framework.Handle
}

var lastRetrieved time.Time
var EmissionRank = map[string]int64{}
var mutex = &sync.RWMutex{}

// Name is the name of the plugin used in the plugin registry and configurations.
const Name = "CarbonScore"

// Name returns name of the plugin. It is used in logs, etc.
func (pl *Plugin) Name() string {
	return Name
}

func (pl *Plugin) Score(ctx context.Context, state *framework.CycleState, p *v1.Pod, nodeName string) (int64, *framework.Status) {
	nodeInfo, err := pl.handle.SnapshotSharedLister().NodeInfos().Get(nodeName)
	if err != nil {
		return 0, framework.AsStatus(fmt.Errorf("getting node %q from Snapshot: %w", nodeName, err))
	}

	score := calculateScores(nodeInfo)
	return score, nil
}

func (pl *Plugin) ScoreExtensions() framework.ScoreExtensions {
	return nil
}

func calculateScores(nodeInfo *framework.NodeInfo) int64 {
	if lastRetrieved.IsZero() {
		lastRetrieved = time.Now()
	}
	emissionRank, err := getEmissionRanking(lastRetrieved)
	if err != nil {
		klog.Error(err)
		return 0
	}
	//region := nodeInfo.Node().Labels["node.kubernetes.io/region"]
	region := nodeInfo.Node().Annotations["node.kubernetes.io/region"]
	klog.Errorf("Region of the node is: ", region)
	score := emissionRank[region]
	return int64(score)
}

func getEmissionRanking(lastRetrieved time.Time) (map[string]int64, error) {
	if lastRetrieved.IsZero() || time.Now().Sub(lastRetrieved) >= 5*time.Minute || len(EmissionRank) == 0 {
		err := queryDataFromServer()
		if err != nil {
			return map[string]int64{}, err
		}
		lastRetrieved = time.Now()
		return EmissionRank, nil
	}
	return EmissionRank, nil
}

func queryDataFromServer() error {
	url := "http://metrics-collector.default.svc.cluster.local:8080/getemission"
	method := "GET"
	client := &http.Client{}

	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		klog.Info(err)
		return err
	}

	res, err := client.Do(req)
	if err != nil {
		klog.Info(err)
		return err
	}
	decoder := json.NewDecoder(res.Body)
	mutex.Lock()
	err = decoder.Decode(&EmissionRank)
	mutex.Unlock()
	if err != nil {
		klog.Info(err)
		return err
	}
	return nil
}

// New initializes a new plugin and returns it.
func New(_ runtime.Object, h framework.Handle) (framework.Plugin, error) {
	return &Plugin{handle: h}, nil
}
