package squaresvc

import (
	"context"
	"encoding/json"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/daconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/p2e/daconfp2e"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squarereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squareresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"

	"github.com/pkg/errors"
)

// GetAgentInfo implements iv3portdriver.IMarketSvc.
func (svc *squareSvc) GetAgentInfo(ctx context.Context, agentInfoReq *squarereq.AgentInfoReq) (res *squareresp.AgentMarketAgentInfoResp, err error) {
	res = squareresp.NewAgentMarketAgentInfoResp()
	res.LatestVersion = string(cdaenum.StatusUnpublished)

	// 1. 获取最新 v0 版本 Agent 配置
	agentV0CfgPo, err := svc.agentConfRepo.GetByID(ctx, agentInfoReq.AgentID)
	if err != nil {
		if chelper.IsSqlNotFound(err) {
			err = capierr.NewCustom404Err(ctx, apierr.DataAgentConfigNotFound, "agent not found")
			return
		}

		err = errors.Wrapf(err, "[squareSvc.GetAgentInfo]:svc.agentConfRepo.GetByID(ctx, %s)", agentInfoReq.AgentID)

		return
	}

	// 2. 记录访问日志
	visitLogErr := svc.RecordVisitLog(ctx, agentInfoReq)
	if visitLogErr != nil {
		svc.Logger.Warnf("svc.RecordVisitLog(ctx, %+v) failed, err:%v\n", agentInfoReq, visitLogErr)
	}

	// 3. 获取历史发布的最新版本号
	latestReleaseHistoryPO, historyErr := svc.releaseHistoryRepo.GetLatestVersionByAgentID(ctx, agentInfoReq.AgentID)

	if historyErr != nil {
		svc.Logger.Warnf("svc.releaseHistoryRepo.GetLatestVersionByAgentID(ctx, %s) failed, err:%v\n", agentInfoReq.AgentID, historyErr)
	} else if latestReleaseHistoryPO != nil {
		res.LatestVersion = latestReleaseHistoryPO.AgentVersion
	}

	// 4. 如果是未发布的版本，返回 V0版本配置，同时版本号设置为 v0
	if agentInfoReq.AgentVersion == daconstant.AgentVersionUnpublished {
		var agentCfgEO *daconfeo.DataAgent

		agentCfgEO, err = daconfp2e.DataAgent(ctx, agentV0CfgPo)
		if err != nil {
			err = errors.Wrapf(err, "[squareSvc.GetAgentInfo]:daconfp2e.DataAgent(&po.DataAgentPo)")
			return
		}

		res.Version = daconstant.AgentVersionUnpublished
		res.DataAgent = *agentCfgEO
		res.Config = *res.DataAgent.Config

		return
	}

	// 5. agentInfoReq.AgentVersion != daconstant.AgentVersionUnpublished时
	err = svc.notUnpublished(ctx, agentInfoReq, res)
	if err != nil {
		return
	}

	return
}

func (svc *squareSvc) notUnpublished(ctx context.Context, agentInfoReq *squarereq.AgentInfoReq, res *squareresp.AgentMarketAgentInfoResp) (err error) {
	// 1. 获取发布记录
	releasePo, err := svc.releaseRepo.GetByAgentID(ctx, agentInfoReq.AgentID)
	if err != nil {
		err = errors.Wrapf(err, "svc.releaseRepo.GetByAgentId(ctx, %s)", agentInfoReq.AgentID)
		return
	}
	// 2. 如果是已发布版本，则基于已发布版本的配置返回结果
	if releasePo != nil && agentInfoReq.AgentVersion == daconstant.AgentVersionLatest {
		agentInfoReq.AgentVersion = releasePo.AgentVersion
	}

	// 3. 如果版本号为空，返回错误
	if agentInfoReq.AgentVersion == "" {
		err = errors.Wrapf(err, "agent version is empty")
		return
	}

	// 4. 获取 指定Agent 版本的配置，检查发布状态
	historyPo, err := svc.releaseHistoryRepo.GetByAgentIdVersion(ctx, agentInfoReq.AgentID, agentInfoReq.AgentVersion)
	if err != nil {
		err = errors.Wrapf(err, " svc.releaseRepo.GetByAgentIdVersion(ctx, %s, %s)", agentInfoReq.AgentID, agentInfoReq.AgentVersion)
		return
	}

	if historyPo == nil {
		err = fmt.Errorf("the agent version:%s is not exist", agentInfoReq.AgentVersion)
		return
	}

	// 5. 将historyPo.AgentConfig 转换为 DataAgentPo
	agentCfgPo := &dapo.DataAgentPo{}

	err = json.Unmarshal([]byte(historyPo.AgentConfig), agentCfgPo)
	if err != nil {
		err = errors.Wrapf(err, "json.Unmarshal([]byte(%s), &agentCfg)", historyPo.AgentConfig)
		return
	}

	// 6. po 转 eo
	agentCfgEO, err := daconfp2e.DataAgent(ctx, agentCfgPo)
	if err != nil {
		err = errors.Wrapf(err, "daconfp2e.DataAgent(&po.DataAgentPo)")
		return
	}

	// 7. eo 转 res
	res.DataAgent = *agentCfgEO

	res.Version = agentInfoReq.AgentVersion
	res.Description = historyPo.AgentDesc
	res.PublishedAt = historyPo.UpdateTime
	res.Config = *res.DataAgent.Config
	res.LatestVersion = releasePo.AgentVersion

	res.PublishInfo.LoadFromReleasePo(releasePo)

	// 8. 获取用户信息
	userIDS := []string{historyPo.UpdateBy}
	userFields := []string{"name"}

	users, err := svc.usermanagementHttpClient.GetUserInfoByUserID(ctx, userIDS, userFields)
	if err != nil {
		svc.Logger.Warnf("get user info failed, err: %v", err)
		err = nil

		return
	}

	if user, ok := users[historyPo.UpdateBy]; ok {
		res.PublishedBy = historyPo.UpdateBy
		res.PublishedByName = user.Name
	}

	return
}

// 记录访问日志，用于最近使用展示
func (svc *squareSvc) RecordVisitLog(ctx context.Context, agentInfoReq *squarereq.AgentInfoReq) (err error) {
	// 记录访问日志
	if !agentInfoReq.IsVisit {
		return
	}

	historyAgentVersion := agentInfoReq.AgentVersion
	// 访问历史中只保存 发布版本和未发布版本记录，发布版本统一记录成一条访问记录，防止访问历史记录过多
	if historyAgentVersion != daconstant.AgentVersionUnpublished {
		historyAgentVersion = daconstant.AgentVersionLatest
	}

	currentTs := cutil.GetCurrentMSTimestamp()

	visitHistoryPO := &dapo.VisitHistoryPO{
		ID:            cutil.UlidMake(),
		AgentID:       agentInfoReq.AgentID,
		AgentVersion:  historyAgentVersion,
		VisitCount:    1,
		CustomSpaceID: agentInfoReq.CustomSpaceID,
		CreateTime:    currentTs,
		UpdateTime:    currentTs,
		CreateBy:      agentInfoReq.UserID,
		UpdateBy:      agentInfoReq.UserID,
	}

	err = svc.visitHistoryRepo.IncVisitCount(ctx, visitHistoryPO)
	if err != nil {
		svc.Logger.Warnf("inc visit count failed, agent id:%v, agent version: %v, err: %v", agentInfoReq.AgentID, agentInfoReq.AgentVersion, err)
	}

	return
}
