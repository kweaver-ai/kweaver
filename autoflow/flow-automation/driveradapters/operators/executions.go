package operators

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/errors"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm/state"
	liberrors "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/errors"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"github.com/gin-gonic/gin"
)

func (h *OperatorsRESTHandler) execute(c *gin.Context) {
	ctx := c.Request.Context()
	dagID := c.Param("id")
	user, _ := c.Get("user")
	userInfo := user.(*drivenadapters.UserInfo)
	callback := c.GetHeader("X-Callback-URL")
	parentDagInsID := c.GetHeader("X-Parent-Execution-ID")

	bytes, _ := io.ReadAll(c.Request.Body)

	data := make(map[string]interface{})

	if len(bytes) > 0 {
		err := json.Unmarshal(bytes, &data)

		if err != nil {
			errors.ReplyError(c, liberrors.NewPublicRestError(ctx,
				liberrors.PErrorBadRequest,
				liberrors.PErrorBadRequest,
				err.Error()))
			return
		}
	}

	dagIns, vmIns, err := h.mgnt.RunOperator(ctx, dagID, data, callback, callback, parentDagInsID, userInfo)
	if err != nil {
		errors.ReplyError(c, err)
		return
	}

	c.Header("Location", fmt.Sprintf("/api/automation/v1/executions/%s", dagIns.ID))

	if vmIns == nil {
		c.Status(http.StatusAccepted)
		return
	}

	vmState, ret, vmErr := vmIns.Result()

	switch vmState {
	case state.Done:
		c.JSON(http.StatusOK, ret)
	case state.Error:
		errors.ReplyError(c, liberrors.NewPublicRestError(ctx,
			liberrors.PErrorInternalServerError,
			liberrors.PErrorInternalServerError,
			vmErr))
	case state.Wait:
		c.Status(http.StatusAccepted)
	default:
		c.Status(http.StatusNoContent)
	}
}

func (h *OperatorsRESTHandler) getExecution(c *gin.Context) {
	ctx := c.Request.Context()
	dagInsID := c.Param("id")
	user, _ := c.Get("user")
	userInfo := user.(*drivenadapters.UserInfo)

	vmState, ret, err := h.mgnt.GetDagInstanceResultVM(ctx, dagInsID, userInfo)
	if err != nil {
		errors.ReplyError(c, err)
		return
	}

	switch vmState {
	case state.Done:
		c.JSON(http.StatusOK, ret)
	case state.Error:
		errors.ReplyError(c, liberrors.NewPublicRestError(ctx,
			liberrors.PErrorInternalServerError,
			liberrors.PErrorInternalServerError,
			err))
	case state.Wait, state.Run:
		c.Status(http.StatusAccepted)
	default:
		c.Status(http.StatusNoContent)
	}
}

func (h *OperatorsRESTHandler) continueExecution(c *gin.Context) {
	var err error
	ctx, span := trace.StartInternalSpan(context.Background())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	tracelog := traceLog.WithContext(ctx)
	taskID := c.Param("id")
	data, _ := io.ReadAll(c.Request.Body)

	var res entity.AsyncResponseData
	err = json.Unmarshal(data, &res)

	if err != nil {
		errors.ReplyError(c, liberrors.NewPublicRestError(ctx,
			liberrors.PErrorBadRequest,
			liberrors.PErrorBadRequest,
			err.Error()))
		return
	}

	debugMode := os.Getenv("DEBUG")
	if debugMode == "true" {
		tracelog.Infof("callback %s, data: %v", taskID, res)
	}

	results := map[string]any{}

	var status entity.TaskInstanceStatus

	if res.Status == entity.AsyncResponseStatusFailed {
		status = entity.TaskInstanceStatusFailed
		results["error"] = res.Error
	} else {
		status = entity.TaskInstanceStatusSuccess

		if dataMap, ok := res.Data.(map[string]any); ok && len(dataMap) == 0 {
			results["data"] = nil
		} else {
			results["data"] = res.Data
		}
	}

	go func() {
		err = h.mgnt.ContinueBlockInstances(context.Background(), []string{taskID}, results, status)

		if err != nil {
			tracelog.Errorln(err)
			errors.ReplyError(c, err)
			return
		}
	}()

	c.Status(http.StatusOK)
}
