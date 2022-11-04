/*
Copyright The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Code generated by applyconfiguration-gen. DO NOT EDIT.

package v1

// ProbeApplyConfiguration represents an declarative configuration of the Probe type for use
// with apply.
type ProbeApplyConfiguration struct {
	ProbeHandlerApplyConfiguration `json:",inline"`
	InitialDelaySeconds            *int32 `json:"initialDelaySeconds,omitempty"`
	TimeoutSeconds                 *int32 `json:"timeoutSeconds,omitempty"`
	PeriodSeconds                  *int32 `json:"periodSeconds,omitempty"`
	SuccessThreshold               *int32 `json:"successThreshold,omitempty"`
	FailureThreshold               *int32 `json:"failureThreshold,omitempty"`
	TerminationGracePeriodSeconds  *int64 `json:"terminationGracePeriodSeconds,omitempty"`
}

// ProbeApplyConfiguration constructs an declarative configuration of the Probe type for use with
// apply.
func Probe() *ProbeApplyConfiguration {
	return &ProbeApplyConfiguration{}
}

// WithExec sets the Exec field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the Exec field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithExec(value *ExecActionApplyConfiguration) *ProbeApplyConfiguration {
	b.Exec = value
	return b
}

// WithHTTPGet sets the HTTPGet field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the HTTPGet field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithHTTPGet(value *HTTPGetActionApplyConfiguration) *ProbeApplyConfiguration {
	b.HTTPGet = value
	return b
}

// WithTCPSocket sets the TCPSocket field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the TCPSocket field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithTCPSocket(value *TCPSocketActionApplyConfiguration) *ProbeApplyConfiguration {
	b.TCPSocket = value
	return b
}

// WithGRPC sets the GRPC field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the GRPC field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithGRPC(value *GRPCActionApplyConfiguration) *ProbeApplyConfiguration {
	b.GRPC = value
	return b
}

// WithInitialDelaySeconds sets the InitialDelaySeconds field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the InitialDelaySeconds field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithInitialDelaySeconds(value int32) *ProbeApplyConfiguration {
	b.InitialDelaySeconds = &value
	return b
}

// WithTimeoutSeconds sets the TimeoutSeconds field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the TimeoutSeconds field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithTimeoutSeconds(value int32) *ProbeApplyConfiguration {
	b.TimeoutSeconds = &value
	return b
}

// WithPeriodSeconds sets the PeriodSeconds field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the PeriodSeconds field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithPeriodSeconds(value int32) *ProbeApplyConfiguration {
	b.PeriodSeconds = &value
	return b
}

// WithSuccessThreshold sets the SuccessThreshold field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the SuccessThreshold field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithSuccessThreshold(value int32) *ProbeApplyConfiguration {
	b.SuccessThreshold = &value
	return b
}

// WithFailureThreshold sets the FailureThreshold field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the FailureThreshold field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithFailureThreshold(value int32) *ProbeApplyConfiguration {
	b.FailureThreshold = &value
	return b
}

// WithTerminationGracePeriodSeconds sets the TerminationGracePeriodSeconds field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the TerminationGracePeriodSeconds field is set to the value of the last call.
func (b *ProbeApplyConfiguration) WithTerminationGracePeriodSeconds(value int64) *ProbeApplyConfiguration {
	b.TerminationGracePeriodSeconds = &value
	return b
}
