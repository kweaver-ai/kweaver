package usermgnt

import (
	"fmt"
	"net/url"
	"strings"
	"system-backend/internal/config"

	"resty.dev/v3"
)

type UserMgnt struct {
	cli *resty.Client
}

type UserInfo struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Roles   []string `json:"roles"`
	Account string   `json:"account"`
}

func NewUserMgnt(app *config.AppConfig) *UserMgnt {
	return &UserMgnt{
		cli: resty.New().SetBaseURL(app.DepsConfig.UserMgntBaseURL),
	}
}

func (u *UserMgnt) Health() error {
	// return fmt.Errorf("UserMgnt is not health")
	return nil
}

func (h *UserMgnt) UserInfo(uid string) (*UserInfo, error) {
	if uid == "-" {
		return &UserInfo{
			ID:      "-",
			Name:    "-",
			Roles:   []string{},
			Account: "-",
		}, nil
	}

	var result []UserInfo
	uri := fmt.Sprintf(
		"/api/user-management/v1/users/%s/%s",
		url.PathEscape(uid),
		url.PathEscape(strings.Join([]string{
			"account", "name", "roles",
		}, ",")),
	)
	resp, err := h.cli.R().SetResult(&result).Get(uri)

	if err != nil {
		return nil, err
	}

	if resp.IsError() {
		return nil, fmt.Errorf("get userinfo failed: %s", resp.Error())
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("userinfo not found")
	}

	return &result[0], nil
}
