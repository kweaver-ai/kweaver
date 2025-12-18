package drivenadapters

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"github.com/cenkalti/backoff/v4"
	os "github.com/opensearch-project/opensearch-go/v2"
	"github.com/opensearch-project/opensearch-go/v2/opensearchapi"
)

type OpenSearch interface {
	BulkUpsert(ctx context.Context, index string, documents []map[string]any) error
}

var (
	openSearchOnce     sync.Once
	openSearchInstance OpenSearch
)

func NewOpenSearch() OpenSearch {
	openSearchOnce.Do(func() {
		config := common.NewConfig()
		address := fmt.Sprintf("%s://%s:%s", config.OpenSearch.Protocol, config.OpenSearch.Host, config.OpenSearch.Port)
		retryBackoff := backoff.NewExponentialBackOff()
		transport := &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   30 * time.Second, // 连接超时时间
				KeepAlive: 60 * time.Second, // 保持长连接的时间
			}).DialContext, // 设置连接的参数
			MaxIdleConns:          1000,             // 最大空闲连接
			IdleConnTimeout:       60 * time.Second, // 空闲连接的超时时间
			ExpectContinueTimeout: 30 * time.Second, // 等待服务第一个响应的超时时间
			MaxIdleConnsPerHost:   500,              // 每个host保持的空闲连接数
			TLSHandshakeTimeout:   30 * time.Second,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}

		client, _ := os.NewClient(os.Config{
			Addresses: []string{
				address,
			},
			Username:      config.OpenSearch.User,
			Password:      config.OpenSearch.Password,
			Transport:     transport,
			RetryOnStatus: []int{502, 503, 504, 429},
			RetryBackoff: func(attempt int) time.Duration {
				if attempt == 1 {
					retryBackoff.Reset()
				}
				return retryBackoff.NextBackOff()
			},
			MaxRetries: 1,
		})

		openSearchInstance = &openSearch{
			client: client,
		}
	})

	return openSearchInstance
}

type openSearch struct {
	client *os.Client
}

func (o *openSearch) BulkUpsert(ctx context.Context, index string, documents []map[string]any) error {
	var body string

	for _, doc := range documents {
		id, ok := doc["__id"]

		if ok && id != nil {
			if _, isString := id.(string); !isString {
				id = fmt.Sprintf("%v", id)
			}
		}

		var metaBytes []byte
		var docBytes []byte
		var err error

		if !ok || id == "" {
			meta := map[string]any{
				"create": map[string]any{
					"_index": index,
				},
			}
			metaBytes, _ = json.Marshal(meta)
			docBytes, err = json.Marshal(doc)
		} else {
			meta := map[string]any{
				"update": map[string]any{
					"_index": index,
					"_id":    id,
				},
			}
			metaBytes, _ = json.Marshal(meta)
			docBytes, err = json.Marshal(map[string]any{
				"doc":           doc,
				"doc_as_upsert": true,
			})
		}

		if err != nil {
			traceLog.WithContext(ctx).Warnf("bulk upsert err: %v", err)
			continue
		}

		body += string(metaBytes) + "\n" + string(docBytes) + "\n"
	}

	if body == "" {
		traceLog.WithContext(ctx).Warnf("bulk upsert err: empty document")
		return fmt.Errorf("bulk upsert err: empty document")
	}

	req := opensearchapi.BulkRequest{
		Body: strings.NewReader(body),
	}

	res, err := req.Do(ctx, o.client)

	if err != nil {
		traceLog.WithContext(ctx).Warnf("bulk upsert err: %s", err.Error())
		return err
	}

	defer res.Body.Close()

	if res.IsError() {
		traceLog.WithContext(ctx).Warnf("bulk upsert err: %s", res.String())
		return fmt.Errorf("bulk upsert err: %s", res.String())
	}

	return nil
}
