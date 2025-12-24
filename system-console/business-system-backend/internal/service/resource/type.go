package resource

type ResourceObject struct {
	ResourceID   string
	ResourceType string
	BDID         string
	CreateBy     string
}

func (svc *ResourceService) SetToken(token string) *ResourceService {
	svc.cliAuthorization.SetPublicToken(token)
	return svc
}
