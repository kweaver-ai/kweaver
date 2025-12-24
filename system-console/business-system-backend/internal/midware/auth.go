package midware

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/hydra"
	"system-backend/internal/pkg/usermgnt"

	"github.com/gin-gonic/gin"
)

const (
	KeyAuthContext = "mw.auth.record.context"
)

type AuthContext struct {
	UserInfo *usermgnt.UserInfo
	Token    string
	Operator *auditlog.Toperator
}

func AuthMiddleware(
	auth *authorization.Authorization,
	hydra *hydra.Hydra,
	userMgnt *usermgnt.UserMgnt,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				WithMessage("invalid token").
				WithCause("Authorization header is empty").
				GinFailed(c)
			return
		}
		token := authHeader[len("Bearer "):]

		info, err := hydra.Introspect(token)
		if err != nil {
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				SetErr(err).
				WithMessage("invalid token").
				GinFailed(c)
			return
		}

		userInfo, err := userMgnt.UserInfo(info.Sub)
		if err != nil {
			cerror.
				New(cerror.ErrCodeUnauthorized).
				SetHttpCode(http.StatusUnauthorized).
				SetErr(err).
				WithMessage("invalid user_id").
				GinFailed(c)
			return
		}

		operator := auditlog.Toperator{
			ID:   userInfo.ID,
			Name: userInfo.Name,
			Type: "authenticated_user",
			Agent: auditlog.ToperatorAgent{
				IP:   c.ClientIP(),
				Mac:  c.GetHeader("X-Request-MAC"),
				Type: "unknown",
			},
		}

		c.Set(KeyAuthContext, &AuthContext{
			UserInfo: userInfo,
			Operator: &operator,
			Token:    token,
		})
		c.Next()
	}
}
