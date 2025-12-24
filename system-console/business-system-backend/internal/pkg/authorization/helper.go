package authorization

import (
	"fmt"
	"net/url"
	"system-backend/internal/config"

	"github.com/sirupsen/logrus"
	"resty.dev/v3"
)

type Authorization struct {
	private, public *resty.Client
	log             *logrus.Entry
}

func NewAuthorization(app *config.AppConfig, log *logrus.Entry) *Authorization {
	return &Authorization{
		private: resty.New().SetBaseURL(app.DepsConfig.AuthPrivateBaseURL),
		public:  resty.New().SetBaseURL(app.DepsConfig.AuthPublicBaseURL).SetDisableWarn(true),
		log:     log,
	}
}

func (a *Authorization) Health() error {
	uri := "/health/live"
	resp, err := a.private.R().Get(uri)
	if err != nil {
		return err
	}
	if resp.IsError() {
		return fmt.Errorf("Authorization private is not health")
	}

	resp, err = a.public.R().Get(uri)
	if err != nil {
		return err
	}
	if resp.IsError() {
		return fmt.Errorf("Authorization public is not health")
	}
	return nil
}

func (a *Authorization) SetPublicToken(token string) *Authorization {
	a.public.SetAuthToken(token)
	return a
}

func (a *Authorization) registerResourceType(typ string, resourceDefine map[string]any) error {
	var result map[string]any
	uri := fmt.Sprintf("/api/authorization/v1/resource_type/%s", url.PathEscape(typ))
	resp, err := a.private.R().
		SetBody(resourceDefine).
		SetResult(&result).
		SetError(m{}).
		Put(uri)

	if err := a.errorFor(resp, err, "register resource type"); err != nil {
		return err
	}
	return nil
}

func (a *Authorization) errorFor(resp *resty.Response, err error, msg string) error {
	if err != nil {
		return err
	}

	if resp.IsError() {
		a.log.WithFields(logrus.Fields{
			"status": resp.Status(),
			"error":  resp.Error(),
			"url":    resp.Request.URL,
			"method": resp.Request.Method,
		}).Debugf("%s failed", msg)
		rawErr := fmt.Errorf("%s failed: %s", msg, resp.Error())
		// 尝试转换已知错误
		return a.tryError(resp.Error(), rawErr)
	}

	return nil
}
