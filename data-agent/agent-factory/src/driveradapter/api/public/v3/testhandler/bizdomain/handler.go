package bizdomain

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/bizdomainsvc"
	"github.com/gin-gonic/gin"
)

// BizDomainTestHandler 业务域测试handler
type BizDomainTestHandler struct {
	bizDomainSvc *bizdomainsvc.BizDomainSvc
}

var (
	handlerOnce sync.Once
	_handler    *BizDomainTestHandler
)

// NewBizDomainTestHandler 创建业务域测试handler
func NewBizDomainTestHandler() *BizDomainTestHandler {
	handlerOnce.Do(func() {
		_handler = &BizDomainTestHandler{
			bizDomainSvc: dainject.NewBizDomainSvc(),
		}
	})

	return _handler
}

// RegisterRoutes 注册路由
func (h *BizDomainTestHandler) RegisterRoutes(router *gin.RouterGroup) {
	// 原有的完整测试路由
	// https://{host}:{port}/api/agent-factory/internal/v3/test/bizdomain-http
	router.POST("/test/bizdomain-http", h.TestBizDomainHttp)

	// 独立的测试路由
	// https://{host}:{port}/api/agent-factory/internal/v3/test/bizdomain/associate-resource
	router.POST("/test/bizdomain/associate-resource", h.AssociateResourceTestHandler)

	// https://{host}:{port}/api/agent-factory/internal/v3/test/bizdomain/query-resource-associations
	router.POST("/test/bizdomain/query-resource-associations", h.QueryResourceAssociationsTestHandler)

	// https://{host}:{port}/api/agent-factory/internal/v3/test/bizdomain/disassociate-resource
	router.POST("/test/bizdomain/disassociate-resource", h.DisassociateResourceTestHandler)

	// https://{host}:{port}/api/agent-factory/internal/v3/test/bizdomain/has-resource-association
	router.POST("/test/bizdomain/has-resource-association", h.HasResourceAssociationTestHandler)

	// https://{host}:{port}/api/agent-factory/internal/v3/test/bizdomain/fix-missing-agent-tpl-rel
	router.POST("/test/bizdomain/fix-missing-agent-tpl-rel", h.FixMissingAgentTplRelHandler)
}
