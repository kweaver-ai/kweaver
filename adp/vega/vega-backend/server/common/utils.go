// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package common

import (
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	oneGiB = 1024 * 1024 * 1024 //1073741824.0 定义1GB的字节数
)

func GiBToBytes(gib int64) int64 {
	return gib * oneGiB
}

func GetQueryOrDefault(c *gin.Context, key string, defaultValue string) string {
	value := c.Query(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// EscapeLikePattern escapes the LIKE wildcards (%, _) and the default escape
// character (\) in a user-supplied string so it can be safely wrapped with %
// for substring matching. Targets MySQL/MariaDB default escape semantics.
func EscapeLikePattern(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `%`, `\%`)
	s = strings.ReplaceAll(s, `_`, `\_`)
	return s
}
