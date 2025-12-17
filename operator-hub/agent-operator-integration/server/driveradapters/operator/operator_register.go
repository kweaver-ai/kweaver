package operator

import (
	"bytes"
	"mime/multipart"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	"github.com/creasty/defaults"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// OperatorUpdateByOpenAPI 【内部接口】算子更新
func (op *operatorHandle) OperatorUpdateByOpenAPI(c *gin.Context) {
	req := &interfaces.OperatorUpdateReq{
		OperatorRegisterReq: &interfaces.OperatorRegisterReq{
			OperatorInfo:           &interfaces.OperatorInfo{},
			OperatorExecuteControl: &interfaces.OperatorExecuteControl{},
		},
	}
	data, err := op.parseCommonParams(c, req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	if data != "" {
		req.Data = data
	}
	if err = defaults.Set(req); err != nil {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 检验传参大小
	if err = op.Validator.ValidateOperatorImportSize(c.Request.Context(), int64(len(req.Data))); err != nil {
		rest.ReplyError(c, err)
		return
	}
	var userID string
	userID, err = op.getUserID(c, req.UserToken)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	var result interface{}
	switch req.MetadataType {
	case interfaces.MetadataTypeAPI:
		result, err = op.OperatorManager.UpdateOperatorByOpenAPI(c.Request.Context(), req, userID)
	default:
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, "metadata_type is invalid")
	}
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, result)
}

// OperatorRegister 算子注册
func (op *operatorHandle) OperatorRegister(c *gin.Context) {
	req := &interfaces.OperatorRegisterReq{
		OperatorInfo:           &interfaces.OperatorInfo{},
		OperatorExecuteControl: &interfaces.OperatorExecuteControl{},
	}
	data, err := op.parseCommonParams(c, req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	if data != "" {
		req.Data = data
	}
	if err = defaults.Set(req); err != nil {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 检验传参大小
	if err = op.Validator.ValidateOperatorImportSize(c.Request.Context(), int64(len(req.Data))); err != nil {
		rest.ReplyError(c, err)
		return
	}
	var userID string
	userID, err = op.getUserID(c, req.UserToken)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	var result interface{}
	switch req.MetadataType {
	case interfaces.MetadataTypeAPI:
		result, err = op.OperatorManager.RegisterOperatorByOpenAPI(c.Request.Context(), req, userID)
	default:
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, "metadata_type is invalid")
	}
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, result)
}

// parseCommonParams 通用参数处理方法
func (op *operatorHandle) parseCommonParams(c *gin.Context, req interface{}) (data string, err error) {
	switch c.ContentType() {
	case "application/json":
		err = utils.GetBindJSONRaw(c, req)
	case "application/x-www-form-urlencoded":
		err = c.ShouldBind(req)
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		}
	case "multipart/form-data":
		err = c.ShouldBindWith(req, binding.Form)
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
			return
		}
		var file *multipart.FileHeader
		file, err = c.FormFile("data")
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
			return
		}
		// 公共校验和文件读取
		if err = op.Validator.ValidateOperatorImportSize(c.Request.Context(), file.Size); err != nil {
			return
		}
		fileContent, e := file.Open()
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, e.Error())
			return
		}
		defer func() {
			_ = fileContent.Close()
		}()

		buf := new(bytes.Buffer)
		if _, err = buf.ReadFrom(fileContent); err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
			return
		}
		data = buf.String()
	default:
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, "unsupported content type")
	}
	return
}

func (op *operatorHandle) getUserID(c *gin.Context, userToken string) (userID string, err error) {
	var tokenInfo *interfaces.TokenInfo
	ctx := c.Request.Context()
	tokenInfo, ok := common.GetTokenInfoFromCtx(ctx)
	if ok {
		userID = tokenInfo.VisitorID
		return
	}
	tokenInfo, err = op.Hydra.Introspect(ctx, userToken)
	if err != nil {
		op.Logger.WithContext(ctx).Warnf("get user id failed, err: %v", err)
		return
	}
	authContext := &interfaces.AccountAuthContext{
		AccountID:   tokenInfo.VisitorID,
		AccountType: tokenInfo.VisitorTyp.ToAccessorType(),
		TokenInfo:   tokenInfo,
	}
	ctx = common.SetAccountAuthContextToCtx(ctx, authContext)
	c.Request = c.Request.WithContext(ctx)
	userID = tokenInfo.VisitorID
	return
}
