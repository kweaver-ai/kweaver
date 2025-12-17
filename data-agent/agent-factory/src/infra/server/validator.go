package server

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/customvalidator"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

func init() {
	// 注册自定义校验器
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		_ = v.RegisterValidation("checkAgentAndTplName", customvalidator.CheckAgentAndTplName)
	}
}
