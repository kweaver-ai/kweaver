package model

type WebAppSettings struct {
	Name     string
	Parent   string
	Settings map[string]any
}

func (w *WebAppSettings) CompleteParent() *WebAppSettings {
	parent, ok := w.Settings["parent"]
	if !ok {
		w.Parent = ""
	} else {
		w.Parent = parent.(string)
	}
	return w
}
