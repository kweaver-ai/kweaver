package com.aishu.doc.audit.common;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.doc.audit.service.DocAuditDetailService;
import org.activiti.engine.TaskService;
import org.activiti.engine.impl.persistence.entity.TaskEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.InternalGroupModel;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.service.InternalGroupService;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.CommonUtils;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.DocShareApi;
import com.aishu.wf.core.anyshare.client.EfastApi;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.thrift.service.DocumentThriftService;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.ForbiddenException;
import com.aishu.wf.core.common.exception.NotFoundException;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.dto.AuditIdeaConfigDTO;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 文档审核-流程初始化类
 * @author ouandyang
 */
@Slf4j
@Service
public  class DocAuditBeforeService  extends DocAuditCommonService{
    @Autowired
    UserService userService;
    @Autowired
    TaskService taskService;
    @Autowired
    DocumentThriftService docService;
    @Autowired
    DocAuditHistoryService docAuditHistoryService;
    @Autowired
    DocAuditDetailService docAuditDetailService;
    @Autowired
	AnyShareConfig anyShareConfig;
	private DocShareApi docShareApi;
    @Autowired
    InternalGroupService internalGroupService;
    @Autowired
    DocShareStrategyService docShareStrategyService;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        docShareApi = anyShareClient.getDocShareApi();
    }
    /**
     * @description 提交流程前置事件
     * @author ouandyang
     * @param  docAuditApplyModel 文档审核申请数据
     * @param  userId 当前用户ID
     * @updateTime 2021/8/16
     */
    public ProcessInputModel before(DocAuditApplyModel docAuditApplyModel, String userId, String token) {
        User user = userService.getUserById(userId);
        // 提交流程校验待办审核权限
         verifyRule(docAuditApplyModel, user);
        // 发起流程初始化业务数据
        initBizData(docAuditApplyModel, user);
        // 检查附件下载权限
        this.checkPerm(docAuditApplyModel.getAttachments(), token);
        // 保存附件信息
        this.createAttachment(docAuditApplyModel, userId);
        // 校验审核意见是否必填
        this.checkAuditIdeaSwitch(docAuditApplyModel);
        // 初始化退回记录旧流程实例ID
        this.setSendBackData(docAuditApplyModel);
        // 初始化流程提交所需参数
        return initProcessInputModel(docAuditApplyModel, user);
    }

    /**
     * 校验审核规则
     * @param docAuditApplyModel 文档审核申请实体
     * @param user 当前登录用户
     */
    private void verifyRule(DocAuditApplyModel docAuditApplyModel, User user) {
        if (StrUtil.isBlank(docAuditApplyModel.getId())) {
            return ;
        }
        /**
         * 1、查询当前待办是否有效
         * 审核列表中的待办流程被其他审核员审核（当前页未刷新），
         * 点击【审核】弹出审核框，选择意见后提交提示“此条记录已失效或被其他审核员审核完成。”
         */
        TaskEntity task = (TaskEntity) taskService.createTaskQuery()
                .taskId(docAuditApplyModel.getTaskId()).taskAssignee(user.getUserId())
                .singleResult();
        if (task == null) {
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }
        /**
         * 2、审核员密级是否高于文件密级
         * 审核列表如果此时审核员的密级低于待审核文件（文件夹则包括所有子文件）的密级，
         * 则点击【审核】后如果选择通过，确定时，弹出提示：您的密级不足；
         */
        if (docAuditApplyModel.getAuditIdea()) {
            if(docAuditApplyModel.getBizType().equals(DocConstants.BIZ_TYPE_FLOW)){
                if (user.getCsfLevel() == null || user.getCsfLevel() < docAuditApplyModel.getCsfLevel()) {
                    throw new RestException(BizExceptionCodeEnum.A401001102.getCode(),
                            BizExceptionCodeEnum.A401001102.getMessage());
                }
            }else{
                // 获取文档密级
                Map<String, Object> columnMap = new HashMap<>();
                columnMap.put("apply_id",docAuditApplyModel.getId());
                List<DocAuditDetailModel> docAuditDetailModels = docAuditDetailService.listByMap(columnMap);
                for (int i = 0; i < docAuditDetailModels.size(); i++) {
                    Integer docCsfLevel = docService.getDocCsfLevelByDocId( DocConstants.DOC_TYPE_FOLDER.equals(docAuditDetailModels.get(i).getDocType()),docAuditDetailModels.get(i).getDocId());
                    if( docCsfLevel == null){
                        throw new RestException(BizExceptionCodeEnum.A50001101.getCode(),
                                BizExceptionCodeEnum.A50001101.getMessage());
                    }
                    if (user.getCsfLevel() == null || user.getCsfLevel() < docCsfLevel) {
                        throw new RestException(BizExceptionCodeEnum.A401001102.getCode(),
                                BizExceptionCodeEnum.A401001102.getMessage());
                    }
                }
            }
//            Integer docCsfLevel = docService.getDocCsfLevelByDocId(
//                    DocConstants.DOC_TYPE_FOLDER.equals(docAuditApplyModel.getDocType()),
//                    docAuditApplyModel.getDocId());
//            // 赋值最新的文档密级，需要根据该文档密级查询审核员
//            docAuditApplyModel.setCsfLevel(docCsfLevel);
//            if (user.getCsfLevel() == null || docCsfLevel == null || user.getCsfLevel() < docCsfLevel) {
//                throw new RestException(BizExceptionCodeEnum.A401001102.getCode(),
//                        BizExceptionCodeEnum.A401001102.getMessage());
//            }
        }

    }


    /**
     * @description 查询申请是否存在
     * @author ouandyang
     * @param  docAuditApplyModel 文档审核申请实体
     * @updateTime 2021/5/21
     */
    private void checkApply(DocAuditApplyModel docAuditApplyModel) {
        long count = docAuditHistoryService.count(new LambdaQueryWrapper<DocAuditHistoryModel>()
                .eq(DocAuditHistoryModel::getBizId, docAuditApplyModel.getBizId()));
        if (count > 0) {
            throw new IllegalArgumentException("该申请已存在。");
        }
    }

    /**
     * @description 初始化业务数据
     * @author ouandyang
     * @param  docAuditApplyModel 文档审核申请实体
     * @param  user 当前登录用户
     * @updateTime 2021/6/25
     */
    private void initBizData(DocAuditApplyModel docAuditApplyModel, User user) {
        if (StrUtil.isBlank(docAuditApplyModel.getId())) {
            // 查询申请是否存在
            checkApply(docAuditApplyModel);
            docAuditApplyModel.setId(IdUtil.randomUUID());
            docAuditApplyModel.setApplyUserId(user.getUserId());
            docAuditApplyModel.setApplyUserName(user.getUserName());
            if (docAuditApplyModel.getApplyTime() == null) {
                docAuditApplyModel.setApplyTime(new Date());
            }
        }
    }

    private void createAttachment(DocAuditApplyModel docAuditApplyModel, String userId) {
        if (docAuditApplyModel.getAttachments() != null){
            for (String attachment : docAuditApplyModel.getAttachments()) {
                try{
                    taskService.createAttachment("file", docAuditApplyModel.getTaskId(), docAuditApplyModel.getProcInstId(), attachment, userId);
                } catch (Exception e) {
                    log.warn("create attachment err skipped, detail:{}", e.getMessage());
                    continue;
                }
            }
        }
    }

    private void checkPerm(List<String> attachments, String token) {
        if (attachments == null) {
            return;
        }
        JSONObject detail = new JSONObject();
        if (attachments.size() > 10){
            detail.put("limit", 10);
            throw new ForbiddenException(BizExceptionCodeEnum.A403057013.getCode(), BizExceptionCodeEnum.A403057013.getMessage(), detail);
        }
        List<String> notExistFiles = new ArrayList<>();
        List<String> noPerm = new ArrayList<>();
        for (String attachment : attachments) {
            try {
                JSONObject object = docShareApi.checkPerm(attachment, "download", token);
                if (object.containsKey("result")) {
                    if (!object.getInteger("result").equals(0)){
                        noPerm.add(attachment);
                    }
                    continue;
                }
                if (object.getInteger("code") != null && object.getInteger("code").equals(404002006)) {
                    notExistFiles.add(attachment);
                }
            } catch (Exception e) {
                log.warn("check doc perm err, detail: {}", e.getMessage());
                continue;
            }
        }
        if (notExistFiles.size() > 0) {
            detail.put("ids", notExistFiles);
            throw new NotFoundException(BizExceptionCodeEnum.A404057004.getCode(), BizExceptionCodeEnum.A404057004.getMessage(), detail);
        }

        if (noPerm.size() > 0) {
            detail.put("ids", noPerm);
            throw new ForbiddenException(BizExceptionCodeEnum.A403057012.getCode(), BizExceptionCodeEnum.A403057012.getMessage(), detail);
        }
    }

    private void checkAuditIdeaSwitch(DocAuditApplyModel docAuditApplyModel) {
        if (StrUtil.isEmpty(docAuditApplyModel.getProcDefId())) {
            return;
        }
        DocShareStrategy docShareStrategy =docShareStrategyService.getDocShareStrategy(docAuditApplyModel.getProcDefId());
        StrategyConfigsDTO strategyConfigs = JSON.parseObject(docShareStrategy.getStrategyConfigs(), StrategyConfigsDTO.class);
        AuditIdeaConfigDTO  auditIdeaConfig = strategyConfigs == null ? null : strategyConfigs.getAuditIdeaConfig();
        Boolean auditPassOrReject = auditIdeaConfig != null && auditIdeaConfig.getAudit_idea_switch()
                && auditIdeaConfig.getStatus().equals("2") && StrUtil.isEmpty(docAuditApplyModel.getAuditMsg());
        Boolean auditReject = auditIdeaConfig != null && auditIdeaConfig
                .getAudit_idea_switch() && auditIdeaConfig.getStatus().equals("1") && !docAuditApplyModel.getAuditIdea() && StrUtil.isEmpty(docAuditApplyModel.getAuditMsg());
        if (auditPassOrReject || auditReject) {
            throw new RestException(BizExceptionCodeEnum.A400057002.getCode(), BizExceptionCodeEnum.A400057002.getMessage());
        }
    }

    private void setSendBackData(DocAuditApplyModel docAuditApplyModel) {
        // 如果是退回后的审核拒绝不添加审核退回开关和其他信息，标识是提交审核接口逻辑
        docAuditApplyModel.setIsAudit(docAuditApplyModel.getIsAudit() != null && docAuditApplyModel.getIsAudit());
        JSONObject detailObj = JSON.parseObject(docAuditApplyModel.getApplyDetail());
        Object sendBack = detailObj.get("send_back");
        Object conflictApplyId = detailObj.get("conflict_apply_id");
        Boolean isSendBack = detailObj.containsKey("send_back") && detailObj.containsKey("conflict_apply_id");
        if (!isSendBack || isSendBack && !(Boolean) sendBack && StrUtil.isBlank((String) conflictApplyId)) {
            return;
        }
        docAuditApplyModel.setSendBack((Boolean) sendBack);
        docAuditApplyModel.setConflictApplyId((String) conflictApplyId);
        try {
            DocAuditHistoryModel historyInfo = docAuditHistoryService.getByBizId(docAuditApplyModel.getConflictApplyId());
            docAuditApplyModel.setPreProcInstId(historyInfo.getProcInstId());
            docAuditHistoryService.updateHisTaskByApplyId(AuditStatusEnum.SOFTDELETE.getValue(), AuditStatusEnum.SOFTDELETE.getCode(), docAuditApplyModel.getConflictApplyId());
        } catch (Exception e) {
            log.warn("set send back info err, detail: {}", e.getMessage());
        }
    }

    public boolean checkApplyExist(String bizID) {
        DocAuditHistoryModel  history = docAuditHistoryService.getByBizId(bizID);
        if (history == null){
            return false;
        }
        return true;
    }
}
