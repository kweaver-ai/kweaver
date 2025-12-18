// Package middleware validate auth
package middleware

import (
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/errors"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/mod"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/utils"
	ierr "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/errors"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"github.com/gin-gonic/gin"
)

var (
	hydra          drivenadapters.HydraAdmin
	userManagement drivenadapters.UserManagement
	logger         commonLog.Logger
)

func SetMiddleware() {
	hydra = drivenadapters.NewHydraAdmin()
	userManagement = drivenadapters.NewUserManagement()
	logger = commonLog.NewLogger()
}

func SetMiddlewareMock(hydraMock drivenadapters.HydraAdmin, userManagementMock drivenadapters.UserManagement) {
	hydra = hydraMock
	userManagement = userManagementMock
}

// TokenAuth 验证token
func TokenAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		var userInfo = &drivenadapters.UserInfo{}
		userInfo.TokenID = c.GetHeader("Authorization")
		userInfo.UserAgent = c.GetHeader("User-Agent")
		userInfo.Mac = c.GetHeader("X-Request-MAC")

		res, err := hydra.Introspect(c.Request.Context(), strings.TrimPrefix(userInfo.TokenID, "Bearer "))
		if err != nil {
			var code = errors.InternalError
			c.JSON(http.StatusUnauthorized, errors.NewIError(code, "", map[string]string{"hydra": err.Error()}))
			traceLog.WithContext(c.Request.Context()).Warnf(err.Error())
			c.Abort()
			return
		}

		if !res.Active {
			var code = errors.UnAuthorization

			c.JSON(http.StatusUnauthorized, errors.NewIError(code, "", map[string]string{"auth": "token expired"}))
			err = errors.NewIError(code, "", map[string]string{"auth": "token expired"})
			c.Abort()
			return
		}
		userInfo.UdID = res.UdID
		userInfo.LoginIP = res.LoginIP
		userInfo.UserID = res.UserID
		userInfo.ClientType = res.ClientType
		userInfo.AccountType = "user"
		userInfo.ExpiresIn = res.ExpiresIn

		// 应用账户调用ClientID与UserID相同
		if res.ClientID == res.UserID {
			userInfo.AccountType = "app"
			userInfo.VisitorType = common.AppUserType
			c.Set("user", userInfo)
			c.Next()
			return
		}

		switch res.VisitorType {
		case "realname":
			userInfo.VisitorType = common.AuthenticatedUserType
		case "anonymous":
			userInfo.VisitorType = common.AnonymousUserType
			c.Set("user", userInfo)
			c.Next()
			return
		}

		userDetail, err := userManagement.GetUserInfo(userInfo.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", map[string]string{"err": err.Error()}))
			traceLog.WithContext(c.Request.Context()).Warnf(err.Error())
			c.Abort()
			return
		}
		userInfo.UserName = userDetail.UserName
		userInfo.Roles = userDetail.Roles
		userInfo.IsKnowledge = userDetail.IsKnowledge
		userInfo.DepartmentPaths = userDetail.DepartmentPaths
		userInfo.DepartmentNames = userDetail.DepartmentNames

		c.Set("user", userInfo)
		c.Next()
	}
}

// CheckAdmin 验证token
func CheckAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", map[string]string{"err": "userinfo not exist"}))
			c.Abort()
			return
		}
		userInfo := user.(*drivenadapters.UserInfo)
		var isAdmin = utils.IsAdminRole(userInfo.Roles)
		if !isAdmin {
			c.JSON(http.StatusForbidden, errors.NewIError(errors.NoPermission, "", map[string]string{"user": userInfo.UserID}))
			logger.Warnf("[TokenAuth] user %s is not a system administrator", userInfo.UserID)
			c.Abort()
			return
		}
		c.Next()
	}
}

func CheckAdminOrKnowledgeManager() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", map[string]string{"err": "userinfo not exist"}))
			c.Abort()
			return
		}
		userInfo := user.(*drivenadapters.UserInfo)
		var isAdmin = utils.IsAdminRole(userInfo.Roles)

		if !(isAdmin || userInfo.IsKnowledge) {
			c.JSON(http.StatusForbidden, errors.NewIError(errors.NoPermission, "", map[string]string{"user": userInfo.UserID}))
			logger.Warnf("[TokenAuth] user %s is not a system administrator or knowledge manager", userInfo.UserID)
			c.Abort()
			return
		}
		c.Next()
	}
}

func CheckExecutorWhiteList(appstore drivenadapters.Appstore) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", map[string]string{"err": "userinfo not exist"}))
			c.Abort()
			return
		}
		userInfo := user.(*drivenadapters.UserInfo)

		result, err := appstore.GetWhiteListStatus(c.Request.Context(), common.ExecutorWhiteListKey, userInfo.TokenID)

		if err != nil {
			c.JSON(http.StatusForbidden, errors.NewIError(errors.Forbidden, "", []interface{}{err.Error()}))
			c.Abort()
			return
		}

		if result["enable"] != true {
			c.JSON(http.StatusForbidden, errors.NewIError(errors.Forbidden, "", []interface{}{}))
			c.Abort()
			return
		}

		c.Next()
	}
}

// SaveAppToken 应用账户token
func SaveAppToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", map[string]string{"err": "userinfo not exist"}))
			c.Abort()
			return
		}
		userInfo := user.(*drivenadapters.UserInfo)
		if userInfo.AccountType != "app" {
			c.Next()
			return
		}

		tokenID := strings.TrimPrefix(userInfo.TokenID, "Bearer ")

		store := mod.GetStore()

		tokenInfo, err := store.GetTokenByUserID(userInfo.UserID)
		if err != nil {
			logger.Warnf("[saveAppToken] get token err, detail: %s", err.Error())
			c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", nil))
			c.Abort()
			return
		}

		if tokenInfo.UserID == "" {
			appInfo, err := userManagement.GetAppAccountInfo(userInfo.UserID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", map[string]string{"err": err.Error()}))
				c.Abort()
				return
			}

			tokenInfo = &entity.Token{
				UserID:    userInfo.UserID,
				UserName:  appInfo.Name,
				Token:     tokenID,
				ExpiresIn: int(userInfo.ExpiresIn),
				IsApp:     true,
			}
			tokenInfo.Initial()

			err = store.CreateToken(tokenInfo)
			if err != nil {
				logger.Warnf("[saveAppToken] create token err, detail: %s", err.Error())
				c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", nil))
				c.Abort()
				return
			}
		} else {
			if tokenInfo.Token != tokenID {
				tokenInfo.Token = tokenID
				tokenInfo.ExpiresIn = int(userInfo.ExpiresIn)
				tokenInfo.Update()

				err = store.UpdateToken(tokenInfo)
				if err != nil {
					logger.Warnf("[saveAppToken] update token err, detail: %s", err.Error())
					c.JSON(http.StatusInternalServerError, errors.NewIError(errors.InternalError, "", nil))
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}

// CheckBizDomainID checks if the request header contains a valid X-Business-Domain
// It will return a 400 error if the header is empty or missing.
func CheckBizDomainID() gin.HandlerFunc {
	return func(c *gin.Context) {
		bizDomainID := c.Request.Header.Get("X-Business-Domain")
		if strings.TrimSpace(bizDomainID) == "" {
			c.JSON(http.StatusBadRequest, ierr.NewPublicRestError(c.Request.Context(), ierr.PErrorBadRequest, ierr.PErrorBadRequest, "X-Business-Domain Header is required"))
			c.Abort()
			return
		}

		c.Set("bizDomainID", bizDomainID)
		c.Next()
	}
}
