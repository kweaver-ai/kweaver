package common

type ActionConfig struct {
	FullText         ActionFullTextConfig         `yaml:"fulltext"`
	DocFormatConvert ActionDocFormatConvertConfig `yaml:"docformatconvert"`
}

type ActionFullTextConfig struct {
	ExpireSec int64 `yaml:"expireSec" default:"86400"`
}

type ActionDocFormatConvertConfig struct {
	ExpireSec int64 `yaml:"expireSec" default:"86400"`
}
