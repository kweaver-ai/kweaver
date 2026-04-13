// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

// Package anyshare implements the AnyShare fileset connector.
package anyshare

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// SearchFiles searches files based on query parameters.
func (c *AnyShareConnector) SearchFiles(ctx context.Context, docID, keyword string, rows, start int) ([]map[string]any, int64, error) {
	if err := c.Connect(ctx); err != nil {
		return nil, 0, err
	}
	if docID == "" {
		return nil, 0, fmt.Errorf("empty doc id")
	}
	u := fmt.Sprintf("%s/api/ecosearch/v1/file-search", c.baseURL)
	payload := map[string]interface{}{
		"keyword":      keyword,
		"model":        "phrase",
		"range":        []string{fmt.Sprintf("%s/*", docID)},
		"rows":         rows,
		"start":        start,
		"type":         "doc",
		"quick_search": true,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, 0, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", c.authHeader)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, 0, fmt.Errorf("file-search http %d: %s", resp.StatusCode, truncateForLog(raw))
	}

	var result struct {
		Files []map[string]any `json:"files"`
		Hits  int64            `json:"hits"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, 0, fmt.Errorf("file-search decode: %w", err)
	}

	return result.Files, result.Hits, nil
}
