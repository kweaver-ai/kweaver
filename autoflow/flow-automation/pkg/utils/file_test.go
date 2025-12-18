package utils

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFileDagReader_ReadPathsFromDir(t *testing.T) {
	file := &FileDagReader{}
	paths, err := file.ReadPathsFromDir("./tests")
	assert.NoError(t, err)
	wantPaths := []string{
		filepath.Join("tests", "sub-tests", "subtest.yaml"),
		filepath.Join("tests", "testdag.yaml"),
		filepath.Join("tests", "testdag2.yml"),
	}
	assert.Equal(t, wantPaths, paths)
}
