package main

import (
	"math/rand"
	"os"
	"time"

	"carbon-scheduler/pkg/plugins/carbon"
	"github.com/spf13/pflag"
	cliflag "k8s.io/component-base/cli/flag"
	"k8s.io/component-base/logs"
	scheduler "k8s.io/kubernetes/cmd/kube-scheduler/app"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	// BEWARE candidate and proxy must run in different processes, because a scheduler only processes one pod at a time
	// and proxy waits on candidates in filter plugin

	command := scheduler.NewSchedulerCommand(
		scheduler.WithPlugin(carbon.Name, carbon.New))

	// TODO: once we switch everything over to Cobra commands, we can go back to calling
	// utilflag.InitFlags() (by removing its pflag.Parse() call). For now, we have to set the
	// normalize func and add the go flag set by hand.
	pflag.CommandLine.SetNormalizeFunc(cliflag.WordSepNormalizeFunc)
	// utilflag.InitFlags()
	logs.InitLogs()
	defer logs.FlushLogs()

	if err := command.Execute(); err != nil {
		os.Exit(1)
	}
}
