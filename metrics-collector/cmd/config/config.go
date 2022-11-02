package config

import (
	"flag"
)

type ServerOption struct {
	Username    string
	Password    string
	Source      string
	RefreshTime int
}

// ServerOpts server options.
var ServerOpts *ServerOption

// NewServerOption creates a new CMServer with a default config.
func NewServerOption() *ServerOption {
	return &ServerOption{}
}

// AddFlags adds flags for a specific server to the specified FlagSet.
func (s *ServerOption) AddFlags(fs *flag.FlagSet) {
	fs.StringVar(&s.Username, "username", s.Username, "Username of the WattTime account")
	fs.StringVar(&s.Password, "password", s.Password, "Password of the WattTime account")
	fs.StringVar(&s.Source, "source", s.Source, "Data source for metrics collector")
	fs.IntVar(&s.RefreshTime, "refreshtime", s.RefreshTime, "Refresh time")
	flag.Parse()
}

// RegisterOptions registers options.
func (s *ServerOption) RegisterOptions() {
	ServerOpts = s
}
