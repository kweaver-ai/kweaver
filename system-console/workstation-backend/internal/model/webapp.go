package model

type WebApp struct {
	Name     string         `json:"name"`
	Parent   string         `json:"parent"`
	Inline   bool           `json:"inline"`
	Type     string         `json:"type"`
	Manifest map[string]any `json:"manifest"`
}

const (
	WebAppTypeNormal  = "normal"
	WebAppTypeInline  = "inline"
	WebAppTypeCustom  = "custom"
	WebAppTypeBuiltin = "builtin"
)
