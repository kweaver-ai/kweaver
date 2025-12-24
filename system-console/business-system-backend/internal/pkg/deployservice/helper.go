package deployservice

import (
	"system-backend/internal/config"

	"resty.dev/v3"
)

type DeployService struct {
	cli *resty.Client
}

func NewDeployService(app *config.AppConfig) *DeployService {
	return &DeployService{
		cli: resty.New().SetBaseURL(app.DepsConfig.DeployServiceBaseURL),
	}
}

func (a *DeployService) Health() error {
	// return fmt.Errorf("DeployService is not health")
	return nil
}

type Product struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

func (a *DeployService) Products() (map[string]Product, error) {
	return map[string]Product{
		"dip": {
			Name: "DIP",
			ID:   "dip",
		},
	}, nil
}
