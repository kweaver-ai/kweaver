package utils

var half = 0.5

func GetSQEmbeddingVector(origin []float64) (target []int64) {
	if len(origin) == 0 {
		return []int64{}
	}
	max := origin[0]
	min := origin[1]
	for i := range origin {
		if origin[i] > max {
			max = origin[i]
		}
		if origin[i] < min {
			min = origin[i]
		}
	}
	min = -min
	target = make([]int64, 0)
	for i := range origin {
		if origin[i] > 0 {
			target = append(target, GetPositiveNumber(max, 0, origin[i]))
		} else if origin[i] < 0 {
			target = append(target, GetPositiveNumber(min, 0, origin[i]))
		} else {
			target = append(target, 0)
		}
	}
	return target
}

func GetPositiveNumber(max, min, val float64) int64 {
	B := 127
	val = (val - min) / (max - min)
	val *= float64(B)
	intPart := int64(val)
	fracPart := val - float64(intPart)
	if fracPart > half {
		return intPart + 1
	}
	return intPart
}
