package utils

import (
	"encoding/json"
	"log"
)

// JSONToObject 将JSON字符串转换为指定类型的对象
func JSONToObject[T any](jsonStr string) T {
	var result T
	if jsonStr == "" {
		return result
	}

	err := json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		log.Printf("JSONToObject error: %v", err)
		return result
	}
	return result
}

// JSONToObjectWithError 将JSON字符串转换为指定类型的对象，返回错误信息
func JSONToObjectWithError[T any](jsonStr string) (T, error) {
	var result T
	if jsonStr == "" {
		return result, nil
	}

	err := json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		return result, err
	}
	return result, nil
}
