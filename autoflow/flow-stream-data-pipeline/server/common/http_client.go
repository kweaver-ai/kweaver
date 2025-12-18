package common

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	httpClientOnce sync.Once
	httpClient     rest.HTTPClient

	// ohClientOnce sync.Once
	// ohClient     rest.HTTPClient

	// applyDocLibPerm = []string{}
	// applyDocPerm    = []string{}
)

func NewHTTPClient() rest.HTTPClient {
	httpClientOnce.Do(func() {
		httpClient = rest.NewHTTPClient()
	})

	return httpClient
}

func NewHTTPClientWithOptions(options rest.HttpClientOptions) rest.HTTPClient {
	httpClientOnce.Do(func() {
		httpClient = rest.NewHTTPClientWithOptions(options)
	})

	return httpClient
}
