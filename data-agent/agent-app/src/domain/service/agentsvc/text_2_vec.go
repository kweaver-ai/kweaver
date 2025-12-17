package agentsvc

import (
	"path"

	"github.com/yanyiwu/gojieba"
)

var (
	dictDir = "./dict"
)

type text2Vec struct {
	segmenter *gojieba.Jieba
	model     map[string][]float64
	stopWords map[string]struct{}
}

func newJieba() *gojieba.Jieba {
	dictPath := path.Join(dictDir, "jieba.dict.utf8")
	hmmPath := path.Join(dictDir, "hmm_model.utf8")
	userDictPath := path.Join(dictDir, "user.dict.utf8")
	idfPath := path.Join(dictDir, "idf.utf8")
	stopWordsPath := path.Join(dictDir, "stop_words.utf8")

	segmenter := gojieba.NewJieba(dictPath, hmmPath, userDictPath, idfPath, stopWordsPath)
	return segmenter
}

// newText2Vec 文本转向量及相似度计算
func NewText2Vec() *text2Vec {
	segmenter := newJieba()
	return &text2Vec{
		segmenter: segmenter,
		model:     make(map[string][]float64),
		stopWords: make(map[string]struct{}),
	}
}

// scoreRef: 计算 query 与引用内容 slices 之间的评分
func (t *text2Vec) SameWordsPercentage(text1 string, text2 string) float64 {
	text1Words := t.segmenter.Cut(text1, true)
	text2Words := t.segmenter.Cut(text2, true)
	commonWords := intersect(text1Words, text2Words)
	return float64(len(commonWords)) / float64(len(text1Words))
}

// intersect: 查找两个字符串切片的交集
func intersect(a, b []string) []string {
	m := map[string]struct{}{}
	for _, item := range a {
		m[item] = struct{}{}
	}

	resultMap := map[string]struct{}{}
	var result []string
	for _, item := range b {
		_, ok := m[item]
		if !ok {
			continue
		}
		_, ok = resultMap[item]
		if ok {
			continue
		}
		result = append(result, item)
		resultMap[item] = struct{}{}
	}
	return result
}
