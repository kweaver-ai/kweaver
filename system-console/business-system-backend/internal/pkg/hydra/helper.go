package hydra

import (
	"fmt"
	"system-backend/internal/config"

	"resty.dev/v3"
)

type Hydra struct {
	cli *resty.Client
}

type TokenIntrospectInfo struct {
	Sub    string `json:"sub"`
	Active bool   `json:"active"`
}

func NewHydra(app *config.AppConfig) *Hydra {
	return &Hydra{
		cli: resty.New().SetBaseURL(app.DepsConfig.HydraBaseURL),
	}
}

func (h *Hydra) Health() error {
	// return fmt.Errorf("Hydra is not health")
	return nil
}

func (h *Hydra) Introspect(token string) (*TokenIntrospectInfo, error) {
	var result TokenIntrospectInfo
	var uri = "/admin/oauth2/introspect"

	resp, err := h.cli.R().SetFormData(map[string]string{"token": token}).SetResult(&result).Post(uri)
	if err != nil {
		return nil, err
	}

	if resp.IsError() {
		return nil, fmt.Errorf("introspect token failed: %s", resp.Error())
	}

	return &result, nil
}
