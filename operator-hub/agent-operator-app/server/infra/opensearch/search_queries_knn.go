package opensearch

type KnnQuery struct {
	name   string
	k      int
	vector []interface{}
}

func NewKnnQuery(name string, vector []interface{}, k int) *KnnQuery {
	return &KnnQuery{name: name, vector: vector, k: k}
}
func (k *KnnQuery) Source() (interface{}, error) {
	// {"knn":{"field_name":{"vector":[1,2,3],"k":2}}}
	source := make(map[string]interface{})
	kq := make(map[string]interface{})
	source["knn"] = kq

	kq[k.name] = map[string]interface{}{
		"vector": k.vector,
		"k":      k.k,
	}
	return source, nil
}
