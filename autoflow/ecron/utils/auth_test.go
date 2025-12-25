package utils

import (
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ECron/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ECron/mock"
	monkey "devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/Monkey"
	"github.com/golang/mock/gomock"
	jsoniter "github.com/json-iterator/go"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/assert"
)

func newOAuthClient(h HTTPClient) *oauth {
	return &oauth{
		publicAddress: "",
		adminAddress:  "",
		httpClient:    h,
		timer:         nil,
	}
}

func TestAuthInit(t *testing.T) {
	Convey("init", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		h := mock.NewMockHTTPClient(ctrl)

		o := newOAuthClient(h)
		assert.NotEqual(t, o, nil)

		h.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).AnyTimes().Return(nil)

		guard := monkey.PatchInstanceMethod(reflect.TypeOf(o), "RequestToken", func(_ *oauth, id string, secret string, scope []string) (token string, duration time.Duration, err error) {
			return "123", time.Duration(3599), nil
		})
		defer guard.Unpatch()
		// o.init()
		o.Release()
	})
}

func TestAuthRequestToken(t *testing.T) {
	Convey("RequestToken", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		Convey("request success", func() {
			o := newOAuthClient(nil)
			assert.NotEqual(t, o, nil)

			o.httpClient = NewHTTPClient()
			assert.NotEqual(t, o.httpClient, nil)

			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "Post", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}, respParam interface{}) (err error) {
				data := make(map[string]interface{})
				data["access_token"] = "123456"
				data["expires_in"] = 3599
				body, _ := jsoniter.Marshal(data)
				return jsoniter.Unmarshal(body, &respParam)
			})
			defer guard.Unpatch()

			token, duration, err := o.RequestToken("123", "456", []string{"789"})
			assert.Equal(t, token, "123456")
			assert.Equal(t, duration, time.Duration(1e9*(3599-10)))
			assert.Equal(t, err, nil)
		})

		Convey("request failed", func() {
			o := newOAuthClient(nil)
			assert.NotEqual(t, o, nil)

			o.httpClient = NewHTTPClient()
			assert.NotEqual(t, o.httpClient, nil)

			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "Post", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}, respParam interface{}) (err error) {
				return errors.New("failed")
			})
			defer guard.Unpatch()

			_, _, err := o.RequestToken("123", "456", []string{"789"})
			assert.NotEqual(t, err, nil)
		})
	})
}

func TestAuthVerifyToken(t *testing.T) {
	Convey("VerifyToken", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		o := newOAuthClient(nil)
		o.httpClient = NewHTTPClient()
		assert.NotEqual(t, o, nil)

		Convey("authOn is true, o.token is empty", func() {
			_, err := o.VerifyToken("")
			assert.Equal(t, err.Cause, common.ErrTokenEmpty)
		})

		Convey("the token parameter is invalid", func() {
			_, err := o.VerifyToken("123")
			assert.Equal(t, err.Cause, common.ErrInvalidToken)
			assert.Equal(t, err.Code, common.Unauthorized)
		})

		Convey("http post err", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "Post", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}, respParam interface{}) (err error) {
				return errors.New("failed")
			})
			defer guard.Unpatch()

			_, err := o.VerifyToken(fmt.Sprintf("%v %v", common.Bearer, "123"))
			assert.Equal(t, err.Cause, "failed")
		})

		Convey("token active false", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "Post", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}, respParam interface{}) (err error) {
				data := map[string]interface{}{
					"active": false,
				}
				body, _ := jsoniter.Marshal(data)
				return jsoniter.Unmarshal(body, &respParam)
			})
			defer guard.Unpatch()

			_, err := o.VerifyToken(fmt.Sprintf("%v %v", common.Bearer, "123"))
			assert.Equal(t, err.Cause, common.ErrTokenExpired)
			assert.Equal(t, err.Code, common.Unauthorized)
		})

		Convey("no client id", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "Post", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}, respParam interface{}) (err error) {
				data := map[string]interface{}{
					"active": true,
				}
				body, _ := jsoniter.Marshal(data)
				return jsoniter.Unmarshal(body, &respParam)
			})
			defer guard.Unpatch()

			_, err := o.VerifyToken(fmt.Sprintf("%v %v", common.Bearer, "123"))
			assert.Equal(t, err.Cause, common.ErrInvalidToken)
			assert.Equal(t, err.Code, common.Unauthorized)
		})

		Convey("pass", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "Post", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}, respParam interface{}) (err error) {
				data := map[string]interface{}{
					"active":    true,
					"client_id": "123456",
				}
				body, _ := jsoniter.Marshal(data)
				return jsoniter.Unmarshal(body, &respParam)
			})
			defer guard.Unpatch()

			visitor, err := o.VerifyToken(fmt.Sprintf("%v %v", common.Bearer, "123"))
			assert.Equal(t, err, (*common.ECronError)(nil))
			assert.Equal(t, visitor.ClientID, "123456")
		})
	})
}

func TestVerifyHydraVersion(t *testing.T) {
	Convey("VerifyHydraVersion", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		o := newOAuthClient(nil)
		o.httpClient = NewHTTPClient()
		assert.NotEqual(t, o, nil)

		oldVerifyTokenPath := "/oauth2/introspect"
		newVerifyTokenPath := "/admin/oauth2/introspect"
		oldUrl := fmt.Sprintf("%s%s", o.adminAddress, oldVerifyTokenPath)
		newUrl := fmt.Sprintf("%s%s", o.adminAddress, newVerifyTokenPath)
		Convey("return newVerifyTokenPath", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "PostV2", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}) (code int, respParam interface{}, err error) {
				if url == oldUrl {
					return 404, nil, errors.New("failed")
				}
				if url == newUrl {
					return 200, nil, errors.New("failed")
				}
				return 500, nil, errors.New("failed")
			})
			defer guard.Unpatch()

			path, success := o.VerifyHydraVersion()
			assert.Equal(t, path, newVerifyTokenPath)
			assert.Equal(t, success, true)
		})

		Convey("return oldVerifyTokenPath", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "PostV2", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}) (code int, respParam interface{}, err error) {
				if url == oldUrl {
					return 200, nil, errors.New("failed")
				}
				if url == newUrl {
					return 404, nil, errors.New("failed")
				}
				return 500, nil, errors.New("failed")
			})
			defer guard.Unpatch()

			path, success := o.VerifyHydraVersion()
			assert.Equal(t, path, oldVerifyTokenPath)
			assert.Equal(t, success, true)
		})

		Convey("return false", func() {
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(NewHTTPClient()), "PostV2", func(_ *HTTPCli, url string, headers map[string]string, reqParam interface{}) (code int, respParam interface{}, err error) {
				if url == oldUrl {
					return 500, nil, errors.New("failed")
				}
				if url == newUrl {
					return 500, nil, errors.New("failed")
				}
				return 500, nil, errors.New("failed")
			})
			defer guard.Unpatch()

			path, success := o.VerifyHydraVersion()
			assert.Equal(t, path, "")
			assert.Equal(t, success, false)
		})
	})
}
