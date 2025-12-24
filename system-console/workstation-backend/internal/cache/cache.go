package cache

import (
	"sync"
	"sync/atomic"
	"time"
)

var (
	globalMap sync.Map
	length    int64
)

func Set(key string, data any, timeout time.Duration) {
	globalMap.Store(key, data)
	atomic.AddInt64(&length, 1)
	time.AfterFunc(timeout, func() {
		atomic.AddInt64(&length, -1)
		globalMap.Delete(key)
	})
}

func Get(key string) (any, bool) {
	return globalMap.Load(key)
}

//func Len() int {
//	return int(length)
//}
