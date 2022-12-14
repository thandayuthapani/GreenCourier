# OpenAPI v2 Protocol Buffer Models

This directory contains a Protocol Buffer-language model and related code for
supporting OpenAPI v2.

Gnostic applications and plugins can use OpenAPIv2.proto to generate Protocol
Buffer support code for their preferred languages.

OpenAPIv2.go is used by Gnostic to read JSON and YAML OpenAPI descriptions into
the Protocol Buffer-based datastructures generated from OpenAPIv2.proto.

OpenAPIv2.proto and OpenAPIv2.go are generated by the Gnostic compiler
generator, and OpenAPIv2.pb.go is generated by protoc, the Protocol Buffer
compiler, and protoc-gen-go, the Protocol Buffer Go code generation plugin.
