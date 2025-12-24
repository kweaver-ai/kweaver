package midware

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/pkg/usermgnt"

	"github.com/gin-gonic/gin"
)

const (
	KeyAccountContext = "mw.account.record.context"
)

type AccountContext struct {
	UserInfo *usermgnt.UserInfo
}

func AccountMiddleware(
	userMgnt *usermgnt.UserMgnt,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := &AccountContext{}
		accountID := c.GetHeader("x-account-id")
		accountType := c.GetHeader("x-account-type")

		if accountID != "" {
			if accountType == "" {
				cerror.
					New(cerror.ErrCodeUnauthorized).
					SetHttpCode(http.StatusUnauthorized).
					WithMessage("both account type and account id must be provided.").
					GinFailed(c)
				return
			}

			userInfo, err := userMgnt.UserInfo(accountID)
			if err != nil {
				cerror.
					New(cerror.ErrCodeUnauthorized).
					SetHttpCode(http.StatusUnauthorized).
					SetErr(err).
					WithMessage("invalid user_id").
					GinFailed(c)
				return
			}
			actx.UserInfo = userInfo
		}

		c.Set(KeyAccountContext, actx)
		c.Next()
	}
}
