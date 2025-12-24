package authorization

import (
	"fmt"
	"os"
	"strings"

	"resty.dev/v3"
)

type Client struct {
	cli *resty.Client
}

func NewClient(baseUrl string) *Client {
	cli := resty.New()
	cli.SetBaseURL(baseUrl)
	return &Client{
		cli: cli,
	}
}

func (c *Client) ResourceList(uid string) ([]string, error) {
	// 保留mock逻辑
	mockEnv := os.Getenv("MOCK_RESOURCE_LIST")
	if mockEnv != "" {
		return strings.Split(mockEnv, ","), nil
	}
	type m = map[string]any
	type l = []any
	type resultType struct {
		Type string `json:"type"`
		Name string `json:"name"`
		ID   string `json:"id"`
	}
	var qResult []resultType
	resp, err := c.cli.R().
		SetBody(m{
			"accessor": m{
				"id":   uid,
				"type": "user",
			},
			"resource": m{
				"type": "menu",
			},
			"operation": l{"display"},
			"method":    "GET",
		}).
		SetResult(&qResult).
		Post("/api/authorization/v1/resource-list")
	if err != nil {
		return nil, fmt.Errorf("request query authorized resource error: %w", err)
	}
	if resp.IsError() {
		return nil, fmt.Errorf("get menu authorized resource error: %s", resp.Status())
	}

	result := make([]string, 0, len(qResult))
	for _, r := range qResult {
		result = append(result, r.ID)
	}
	return result, nil
}
