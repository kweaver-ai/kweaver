package override

func mapToList[T any, V any](m map[string]T, f func(k string, s T) V) []V {
	list := make([]V, 0, len(m))
	for k, v := range m {
		list = append(list, f(k, v))
	}
	return list
}

func extractMap[T any, R any](src map[string]T, f func(k string, s T) R) map[string]R {
	result := make(map[string]R, len(src))
	for k, v := range src {
		result[k] = f(k, v)
	}
	return result
}
