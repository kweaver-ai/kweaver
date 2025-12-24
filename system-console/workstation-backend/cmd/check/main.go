package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"

	"workstation-backend/internal/logic/webapp"
)

func readInput() ([]byte, error) {
	// 检查是否有管道输入
	stat, _ := os.Stdin.Stat()
	hasPipeInput := (stat.Mode() & os.ModeCharDevice) == 0

	switch {
	case len(os.Args) > 1: // 参数优先
		return os.ReadFile(os.Args[1])
	case hasPipeInput: // 有管道数据
		return io.ReadAll(os.Stdin)
	default: // 无输入源
		return nil, fmt.Errorf("no input source")
	}
}

func main() {
	data, err := readInput()
	if err != nil {
		panic(err)
	}
	var manifest webapp.Manifest
	var manifests []webapp.Manifest
	var finalManifest []webapp.Manifest
	err1 := json.Unmarshal(data, &manifest)
	err2 := json.Unmarshal(data, &manifests)
	switch {
	case err1 == nil && err2 != nil:
		finalManifest = append(finalManifest, manifest)
	case err2 == nil && err1 != nil:
		finalManifest = append(finalManifest, manifests...)
	default:
		msg := fmt.Sprintf(
			"invalid json manifest\nparse to object err1: %v\nparse to array  err2: %v",
			err1,
			err2,
		)
		fmt.Fprintf(os.Stderr, "manifest check failed: %v\n", msg)
		os.Exit(1)
	}

	err = webapp.CheckManifest(finalManifest)
	if err != nil {
		fmt.Fprintf(os.Stderr, "manifest check failed: %v\n", err)
		os.Exit(1)
	} else {
		fmt.Println("manifest check passed")
	}
}
