package demo

import (
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/drivenadapters"
	myErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/logics/demo"
	"github.com/gin-gonic/gin"
)

type DocumentOperatorHandler interface {
	BulkIndex(c *gin.Context)
	Search(c *gin.Context)
}

var (
	once sync.Once
	h    DocumentOperatorHandler
)

type documentOperatorHanle struct {
	Logger              interfaces.Logger
	Hydra               interfaces.Hydra
	DemoOperatorService interfaces.DemoOperatorService
}

func NewDocumentOperatorHandler(logger interfaces.Logger) DocumentOperatorHandler {
	once.Do(func() {
		h = &documentOperatorHanle{
			Hydra:               drivenadapters.NewHydra(),
			Logger:              logger,
			DemoOperatorService: demo.NewDocumentOperatorService(logger),
		}
	})
	return h
}

func (h *documentOperatorHanle) BulkIndex(c *gin.Context) {
	// 定义接受请求体
	var req interfaces.BulkDocumentIndexRequest
	var err error

	if err = c.ShouldBindJSON(&req); err != nil {
		h.Logger.Error("bind request body failed", err)
		err = myErr.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}

	if err = h.DemoOperatorService.BulkIndex(c.Request.Context(), req); err != nil {
		h.Logger.Error("bulk index failed", err)
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, nil)
}

func (h *documentOperatorHanle) Search(c *gin.Context) {
	var req interfaces.DocumentSearchRequest
	var err error

	if err = c.ShouldBindJSON(&req); err != nil {
		h.Logger.Error("bind request body failed", err)
		err = myErr.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}

	if req.Limit <= 0 {
		req.Limit = 10
	}

	var resp interfaces.DocumentSearchResponse
	if resp, err = h.DemoOperatorService.Search(c.Request.Context(), req); err != nil {
		h.Logger.Error("search failed", err)
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, resp)
}
