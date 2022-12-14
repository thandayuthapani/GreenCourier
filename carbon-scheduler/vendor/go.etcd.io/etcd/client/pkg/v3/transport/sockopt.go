package transport

import (
	"syscall"
)

type Controls []func(network, addr string, conn syscall.RawConn) error

func (ctls Controls) Control(network, addr string, conn syscall.RawConn) error {
	for _, s := range ctls {
		if err := s(network, addr, conn); err != nil {
			return err
		}
	}
	return nil
}

type SocketOpts struct {
	// ReusePort enables socket option SO_REUSEPORT [1] which allows rebind of
	// a port already in use. User should keep in mind that flock can fail
	// in which case lock on data file could result in unexpected
	// condition. User should take caution to protect against lock race.
	// [1] https://man7.org/linux/man-pages/man7/socket.7.html
	ReusePort bool
	// ReuseAddress enables a socket option SO_REUSEADDR which allows
	// binding to an address in `TIME_WAIT` state. Useful to improve MTTR
	// in cases where etcd slow to restart due to excessive `TIME_WAIT`.
	// [1] https://man7.org/linux/man-pages/man7/socket.7.html
	ReuseAddress bool
}

func getControls(sopts *SocketOpts) Controls {
	ctls := Controls{}
	if sopts.ReuseAddress {
		ctls = append(ctls, setReuseAddress)
	}
	if sopts.ReusePort {
		ctls = append(ctls, setReusePort)
	}
	return ctls
}

func (sopts *SocketOpts) Empty() bool {
	return !sopts.ReuseAddress && !sopts.ReusePort
}
