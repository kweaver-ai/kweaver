package authorization

import (
	"errors"
)

var ErrUserNotFount = errors.New("authorization: user not found")

type stdErr struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Detail      any    `json:"detail,omitempty"`
}

func (a *Authorization) tryError(respErr any, rawErr error) error {
	if respE, ok := respErr.(*stdErr); ok {
		switch respE.Code {
		case "UserManagement.BadRequest.UserNotFound":
			return errors.Join(rawErr, ErrUserNotFount)
		}
	}
	return rawErr
}
