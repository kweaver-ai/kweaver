package com.aishu.doc.audit.common;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.dto.DocAuditorDTO;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.vo.Countersign;
import com.aishu.doc.audit.vo.Transfer;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.CommonUtils;
import com.aishu.doc.email.AbstractEmailService;
import com.aishu.doc.msg.service.DocAuditMsgNotice;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.ForbiddenException;
import com.aishu.wf.core.common.exception.InternalException;
import com.aishu.wf.core.common.exception.NotFoundException;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.common.CodeConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.TransferInfo;
import com.aishu.wf.core.doc.service.CountersignInfoService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.doc.service.TransferInfoService;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.core.service.WorkFlowClinetService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;

import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @description 文档审核-流程执行类
 * @author ouandyang
 */
@Slf4j
@Service
public  class DocAuditSubmitService{
    @Autowired
    UserService userService;
    @Autowired
    WorkFlowClinetService workFlowClinetService;
    @Autowired
    NsqSenderService nsqSenderService;
    @Autowired
    DocAuditHistoryService docAuditHistoryService;
    @Autowired
    DocAuditApplyService docAuditApplyService;
    @Autowired
    DictService dictService;
    @Autowired
    DocAuditMsgNotice docAuditMsgNotice;
    @Autowired
    DocAuditBeforeService docAuditBeforeService;
    @Autowired
    DocAuditAfterService docAuditAfterService;
    @Autowired
    ProcessInstanceService processInstanceService;
    @Autowired
    CountersignInfoService countersignInfoService;
    @Autowired
    UserManagementService userManagementService;
    @Autowired
    private ProcessDefinitionService processDefinitionService;
    @Autowired
    AuditConfig auditConfig;
    @Autowired
    DocAuditSubmitService docAuditSubmitService;
    @Autowired
    DocShareStrategyService docShareStrategyService;
    @Autowired
    TransferInfoService transferInfoService;
    @Autowired
    private ThreadPoolTaskExecutor executor;


    /**
     * @description 提交流程
     * @author hanj
     * @param docAuditApplyModel docAuditApplyModel
     * @param model model
     * @updateTime 2021/6/17
     */
    public ProcessInstanceModel submit(DocAuditApplyModel docAuditApplyModel, ProcessInputModel model){
        ProcessInstanceModel processInstanceModel = null;
        try {
            processInstanceModel = workFlowClinetService.submitProcess(model);
            // 开始环节自动拒绝
            if (StrUtil.isBlank(processInstanceModel.getProcessInputModel().getWf_curActInstId()) &&
                    processInstanceModel.isAutoReject()) {
                // 1、开始环节自动拒绝，流程直接结束
                // 2、前面通环节全部自动过，后面环节自动拒绝
                docAuditApplyModel.setProcInstId(processInstanceModel.getProcInstId());
                throw new WorkFlowException(ExceptionErrorCode.S0002, ExceptionErrorCode.S0002.getErrorDesc());
            }
        } catch (WorkFlowException e){
            try {
                // 处理提交流程异常信息
                String beanName = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX;
                // 判断当前流程是否是任意审核，
                if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
                    beanName += docAuditApplyModel.getBizType();
                }
                DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
                        beanName, DocAuditBizService.class);
                docAuditBizService.submitErrorHandle(docAuditApplyModel, model, processInstanceModel, e);
            } catch (WorkFlowException we){
                throw new RestException(we.getExceptionErrorCode().getErrorCode(),
                        we.getWebShowErrorMessage());
            }
        }
        return processInstanceModel;
    }


    /**
     * @description 批量根据流程实例ID作废流程
     * @author ouandyang
     * @param  procInstIds 流程实例ID
     * @updateTime 2021/6/9
     */
    public void batchCancel(List<String> procInstIds,String userId,String reason){
        try {
            processInstanceService.processInstanceBatchCancel(procInstIds, userId, reason);
        } catch (Exception e) {
            log.warn("processInstanceBatchCancel error,procInstIds:"+procInstIds, e);
        }
        List<DocAuditApplyModel> list = docAuditApplyService.list(new LambdaQueryWrapper<DocAuditApplyModel>()
                .in(DocAuditApplyModel::getProcInstId, procInstIds));
        List<String> ids = list.stream().map(item -> item.getId()).collect(Collectors.toList());

        Integer auditStatusCode = AuditStatusEnum.CANCEL.getValue();
        String auditStatus = DocConstants.AUDIT_STATUS_REJECT;
        if (reason.equals(DocConstants.PROC_DEF_BROKEN)) {
            auditStatusCode = AuditStatusEnum.UNDONE.getValue();
            auditStatus = DocConstants.AUDIT_STATUS_UNDONE;
        }
        DocAuditHistoryModel docAuditHistoryModel = DocAuditHistoryModel.builder()
                .auditStatus(auditStatusCode)
                .lastUpdateTime(new Date()).build();
        if(reason.equals(DocConstants.FLOW_DEL_FILE_CANCEL) || DocConstants.USER_DELETED.equals(reason)){
            auditStatus = DocConstants.AUDIT_STATUS_CANCEL;
        }
        docAuditHistoryService.update(docAuditHistoryModel, new LambdaUpdateWrapper<DocAuditHistoryModel>()
                .in(DocAuditHistoryModel::getId, ids));
        docAuditApplyService.removeByIds(ids);
        docAuditHistoryService.batchUpdateHisTaskStatus(docAuditHistoryModel.getAuditStatus(), procInstIds);
        for (DocAuditApplyModel docAuditApplyModel : list) {
            //文档流转作废流程给申请人发送邮件
            if(reason.equals(DocConstants.FLOW_DEL_FILE_CANCEL) || DocConstants.USER_DELETED.equals(reason)){
                flowApplySendEmail(docAuditApplyModel);
            }
            // 发送NSQ拒绝消息
            String beanName = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX;
            // 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
            if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
                beanName += docAuditApplyModel.getBizType();
            }
            DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
                    beanName, DocAuditBizService.class);
            docAuditBizService.sendAuditNotify(docAuditApplyModel.getBizId(), auditStatus, docAuditApplyModel.getBizType(), docAuditApplyModel.getApplyType());
            docAuditAfterService.cancleAttachmentPerm(docAuditApplyModel);

            // 撤销后更新消息通知状态
            ProcessInstanceModel processInstance = this.setRevocationFields(docAuditApplyModel);
            ProcessInputModel model = processInstance.getProcessInputModel();
            Map<String, Object> fields = model.getFields();
            fields.put("isRevocation", true);
            fields.put("deleteReason", reason);
            model.setFields(fields);
            processInstance.setProcessInputModel(model);
            ProcessDefinitionModel oldProcDefModel = processDefinitionService.getProcessDef(docAuditApplyModel.getProcDefId());
            processInstance.setProcessDefinition(oldProcDefModel);
            docAuditMsgNotice.updateTodoMessageAsync(processInstance, userId, null);
        }
    }

    /**
     * @description 封装发送邮件所需的参数
     * @author xiashenghui
     * @param  docAuditApplyModel 文档审核申请实体
     * @updateTime 2022/6/15
     */
    public void flowApplySendEmail (DocAuditApplyModel docAuditApplyModel) {
        // 发送邮件
        ProcessInstanceModel processInstance = new ProcessInstanceModel();
        processInstance.setProcInstId(docAuditApplyModel.getProcInstId());
        processInstance.setBusinessKey(docAuditApplyModel.getId());
        ProcessInputModel model = new ProcessInputModel();
        Map<String, Object> fields = Maps.newHashMap();
        fields.put("type", docAuditApplyModel.getApplyType());
        fields.put("flowDeleteReason", true);
        fields.put("docNames", docAuditApplyModel.getDocNames());
        processInstance.setStartUserId(docAuditApplyModel.getApplyUserId());
        model.setFields(fields);
        processInstance.setProcessInputModel(model);
        ProcessDefinitionModel oldProcDefModel = processDefinitionService.getProcessDef(docAuditApplyModel.getProcDefId());
        processInstance.setProcessDefinition(oldProcDefModel);
        nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_MSG, JSONUtil.toJsonStr(processInstance));
    }



    /**
     * @description 根据业务ID作废流程
     * @author ouandyang
     * @param  bizId 业务ID
     * @param  userId 操作用户ID
     * @param  auditStatus 作废状态（作废、撤销）
     * @param  deleteReason 作废理由
     * @param  nsqNotification 是否发送nsq结果反馈
     * @updateTime 2021/8/12
     */
    public DocAuditApplyModel cancelByBizId(String bizId, String userId, Integer auditStatus,
                                            String deleteReason, boolean nsqNotification){
        DocAuditApplyModel docAuditApplyModel = null;
        if (DocConstants.DELETE_REASON_PROC_DEF_DELETE.equals(deleteReason) || DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)) {
            docAuditApplyModel = docAuditApplyService.selectByBizId(bizId);
        } else {
            if(null == userId){
                docAuditApplyModel = docAuditApplyService.selectByBizId(bizId);
                if (docAuditApplyModel == null) {
                    return null;
                }
                userId = docAuditApplyModel.getApplyUserId();
            } else {
                docAuditApplyModel = docAuditApplyService.selectByBizIdAndUserId(bizId, userId);
            }
        }
        if (docAuditApplyModel == null) {
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }
        try {
            Integer auditMsg = auditStatus;
            if(DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)){
                auditMsg =  AuditStatusEnum.CANCEL.getValue();
            }
            String status = DocConstants.DELETE_REASON_PROC_DEF_DELETE.equals(deleteReason) ? CodeConstants.A0701 : deleteReason;
            if(deleteReason.equals(DocConstants.PROC_FLOW_DEF_DELETE) && "flow".equals(docAuditApplyModel.getApplyType())){
                status = CodeConstants.A0702;
            }
            processInstanceService.processInstanceToCancel(docAuditApplyModel.getProcInstId(),
                    userId, deleteReason);
            docAuditApplyService.removeById(docAuditApplyModel.getId());
            DocAuditHistoryModel docAuditHistoryModel = DocAuditHistoryModel.builder()
                    .auditStatus(auditMsg)
                    .auditMsg(status)
                    .lastUpdateTime(new Date())
                    .id(docAuditApplyModel.getId()).build();
            JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
            detail.set("delName",userService.getUserById(userId).getUserName());
            docAuditHistoryModel.setApplyDetail(detail.toString());
            log.info(deleteReason);
            if (DocConstants.CONFLICT_APPLY.equals(deleteReason)) {
                log.info(bizId + "_");
                docAuditHistoryModel.setBizId(bizId + "_");
            }
            docAuditHistoryService.updateById(docAuditHistoryModel);
            docAuditHistoryService.updateHisTaskStatus(docAuditHistoryModel.getAuditStatus(),
                    docAuditApplyModel.getProcInstId());
            if (nsqNotification) {
                // 发送NSQ拒绝消息
                String beanName = DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX;
                // 判断当前流程是否是任意审核，如果不是的话走以前老逻辑
                if(JSONUtil.parseObj(docAuditApplyModel.getApplyDetail()).get("workflow") == null){
                    beanName += docAuditApplyModel.getBizType();
                }
                DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
                        beanName, DocAuditBizService.class);
                String auditCode = AuditStatusEnum.REJECT.getCode();
                if(DocConstants.DELETE_REASON_PROC_DEF_DELETE.equals(deleteReason) ||
                        DocConstants.DELETE_REASON_REVOCATION.equals(deleteReason)){
                    auditCode = AuditStatusEnum.UNDONE.getCode();
                }else if(DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)){
                    auditCode = DocConstants.AUDIT_STATUS_CANCEL;
                }
                docAuditBizService.sendAuditNotify(docAuditApplyModel.getBizId(), auditCode, docAuditApplyModel.getBizType(), docAuditApplyModel.getApplyType());
            }
        } catch (Exception e) {
            log.warn("作废流程异常，bizId：{}，userId：{}", bizId, userId, e);
        }
        docAuditAfterService.cancleAttachmentPerm(docAuditApplyModel);
        return docAuditApplyModel;
    }

    public void cancelConflictByBizId(String bizId, String userId, Integer auditStatus,
            String deleteReason, boolean nsqNotification) {
        DocAuditApplyModel docAuditApplyModel = this.cancelByBizId(bizId, userId, auditStatus, deleteReason,
                nsqNotification);
        // 发送邮件
        ProcessInstanceModel processInstance = this.setRevocationFields(docAuditApplyModel);
        ProcessInputModel model = processInstance.getProcessInputModel();
        Map<String, Object> fields = model.getFields();
        if (!DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)) {
            fields.put("isRevocation", true);
        } else {
            fields.put("flowDeleteReason", true);
        }

        fields.put("deleteReason", deleteReason);
        // 删除流程给创建人发送邮件
        if (DocConstants.DELETE_REASON_PROC_DEF_DELETE.equals(deleteReason)
                || DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)) {
            processInstance.setStartUserId(docAuditApplyModel.getApplyUserId());
        }
        model.setFields(fields);
        processInstance.setProcessInputModel(model);
        ProcessDefinitionModel oldProcDefModel = processDefinitionService
                .getProcessDef(docAuditApplyModel.getProcDefId());
        processInstance.setProcessDefinition(oldProcDefModel);
        docAuditMsgNotice.updateTodoMessageAsync(processInstance, userId, null);
    }

    /**
     * @description 根据申请ID撤销申请
     * @author ouandyang
     * @param  applyId 申请ID
     * @param  userId 用户ID
     * @updateTime 2021/7/27
     */
    @OperationLog(title = OperationLogConstants.DOC_AUDIT_UNDONE_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    public void revocationByApplyId(String applyId, String userId, String deleteReason) {

        DocAuditApplyModel docAuditApplyModel = this.cancelByBizId(applyId, userId,
                AuditStatusEnum.UNDONE.getValue(), deleteReason, true);
        // 发送邮件
        ProcessInstanceModel processInstance = this.setRevocationFields(docAuditApplyModel);
        ProcessInputModel model = processInstance.getProcessInputModel();
        Map<String, Object> fields = model.getFields();
        if(!DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)){
            fields.put("isRevocation", true);
        }else{
            fields.put("flowDeleteReason", true);
        }

        fields.put("deleteReason", deleteReason);
        // 删除流程给创建人发送邮件
        if (DocConstants.DELETE_REASON_PROC_DEF_DELETE.equals(deleteReason) || DocConstants.PROC_FLOW_DEF_DELETE.equals(deleteReason)) {
            processInstance.setStartUserId(docAuditApplyModel.getApplyUserId());
        }
        model.setFields(fields);
        processInstance.setProcessInputModel(model);
        ProcessDefinitionModel oldProcDefModel = processDefinitionService.getProcessDef(docAuditApplyModel.getProcDefId());
        processInstance.setProcessDefinition(oldProcDefModel);
        docAuditMsgNotice.updateTodoMessageAsync(processInstance, userId, null);
        nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_MSG, JSONUtil.toJsonStr(processInstance));
    }

    /**
     * @description 通过申请ID执行审核加签
     * @param applyId applyId
     * @param userId userId
     * @param countersign countersign
     */
    public void countersignByApplyId(String applyId, String userId, Countersign countersign, Boolean needNotify) {
        DocAuditApplyModel docAuditApplyModel = docAuditApplyService.selectByBizId(applyId);
        if(null == docAuditApplyModel){
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }
        Task task = null;
        try{
            task = processInstanceService.getProcessTask(docAuditApplyModel.getProcInstId(), userId);
        } catch (Exception e) {
            log.warn("通过申请ID执行审核加签，当前待办任务未找到，procInstId：{}，userId：{}", docAuditApplyModel.getProcInstId(), userId);
        }
        if (task == null) {
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }

        String customDescriptionJsonStr = task.getDescription();
        if(StrUtil.isEmpty(customDescriptionJsonStr)){
            throw new RestException(BizExceptionCodeEnum.A50001102.getCode(),
                    BizExceptionCodeEnum.A50001102.getMessage());
        }
        JSONObject customDescriptionJson = JSONUtil.parseObj(customDescriptionJsonStr);
        String customType = customDescriptionJson.getStr("customType");
        if(!"countersign".equals(customType)){
            throw new RestException(BizExceptionCodeEnum.A50001102.getCode(),
                    BizExceptionCodeEnum.A50001102.getMessage());
        }
        String maxAuditors = customDescriptionJson.getStr("maxAuditors");
        String maxCount = customDescriptionJson.getStr("maxCount");

        // 获取已加签用户信息
        List<CountersignInfo> countersignInfoList = countersignInfoService.list(new LambdaQueryWrapper<CountersignInfo>().eq(CountersignInfo::getProcInstId, docAuditApplyModel.getProcInstId())
        .eq(CountersignInfo::getTaskDefKey, task.getTaskDefinitionKey()));
        List<CountersignInfo> sortedCountersignInfoList = countersignInfoList.stream().sorted(Comparator.comparing(CountersignInfo::getBatch).reversed()).collect(Collectors.toList());
        int batch = 0;
        if(sortedCountersignInfoList.size() > 0){
            batch = sortedCountersignInfoList.get(0).getBatch();
        }
        List<String> auditorIds = countersign.getAuditors();
        if(auditorIds.size() > Integer.valueOf(maxAuditors) - sortedCountersignInfoList.size() || Integer.valueOf(maxCount) == batch){
            throw new RestException(BizExceptionCodeEnum.A50001103.getCode(),
                    BizExceptionCodeEnum.A50001103.getMessage());
        }
        List<String> countersignAuditorIds = countersignInfoList.stream().map(CountersignInfo::getCountersignAuditor).collect(Collectors.toList());
        for(String countersignAuditorId : countersignAuditorIds){
            if(auditorIds.contains(countersignAuditorId)) {
                throw new RestException(BizExceptionCodeEnum.A50001104.getCode(),
                        BizExceptionCodeEnum.A50001104.getMessage());
            }
        }

        // 加签判断当同一审核员重复审核同一申请时，是否允许重复审核
        auditorIds = filterRepeatAuditor(docAuditApplyModel, auditorIds);
        if(auditorIds.size() == 0){
            return;
        }

        List<ValueObjectEntity> auditors = userManagementService.names("user", auditorIds);
        String userName = "";
        try {
            User user = userManagementService.getUserInfoById(userId);
            userName = null == user ? "" : user.getName();
        } catch (Exception e) {
            log.warn("加签，查询当前操作用户名信息异常，userId：{}", userId, e);
        }

        if(WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(countersign.getAudit_model())){
            // 逐级审核模式下，进行审核加签
            List<DocAuditorDTO> docAuditorDTOList = JSONUtil.toList(JSONUtil.parseArray(docAuditApplyModel.getAuditor()), DocAuditorDTO.class);
            List<DocAuditorDTO> newDocAuditorDTOList = new ArrayList<>();

            for(DocAuditorDTO docAuditorDTO : docAuditorDTOList){
                newDocAuditorDTOList.add(docAuditorDTO);

                // 若当前用户执行多次加签，则在上次加签审核员之后进行追加，默认追加到当前用户之后
                List<CountersignInfo> curUserCountersignInfoList = sortedCountersignInfoList.stream().filter(cts -> cts.getCountersignBy()
                        .equals(userId)).collect(Collectors.toList());
                String curUserCoutersignLastAuditor = curUserCountersignInfoList.size() > 0 ?
                        docAuditorDTOList.get(docAuditorDTOList.size() - 1).getId() : null;
                boolean addOn = null == curUserCoutersignLastAuditor ? docAuditorDTO.getId().equals(userId) : docAuditorDTO.getId().equals(curUserCoutersignLastAuditor);
                if(addOn){
                    List<User> userInfos = new ArrayList<>();
                    try {
                        userInfos = userManagementService.getUserInfoByIds(String.join(",", auditorIds));
                    } catch (Exception e) {
                        log.warn("加签，查询加签人员集合信息异常，auditorIds：{}", auditorIds, e);
                    }
                    for(String auditorId : auditorIds){
                        List<User> filterAuditorList = userInfos.stream().filter(u -> u.getId().equals(auditorId)).collect(Collectors.toList());
                        if(filterAuditorList.size() > 0){
                            DocAuditorDTO newDocAuditorDTO = new DocAuditorDTO();
                            newDocAuditorDTO.setId(filterAuditorList.get(0).getId());
                            newDocAuditorDTO.setName(filterAuditorList.get(0).getName());
                            newDocAuditorDTO.setAccount(filterAuditorList.get(0).getAccount());
                            newDocAuditorDTO.setStatus("pending");
                            newDocAuditorDTO.setCountersign("y");
                            boolean isExist = newDocAuditorDTOList.stream().filter(nd -> nd.getId().equals(filterAuditorList.get(0).getId())).findAny().isPresent();
                            if(isExist){
                                continue;
                            }
                            newDocAuditorDTOList.add(newDocAuditorDTO);
                        }
                    }
                }
            }
            List<String> userIds = newDocAuditorDTOList.stream().map(DocAuditorDTO::getId).collect(Collectors.toList());
            boolean result = processInstanceService.addTaskForInstanceSerial(String.join(",", userIds), docAuditApplyModel.getProcInstId());
            if(result){
                docAuditApplyModel.setAuditor(JSONUtil.toJsonStr(newDocAuditorDTOList));
                docAuditApplyService.updateById(docAuditApplyModel);
                DocAuditHistoryModel updateDocAuditHistoryModel = DocAuditHistoryModel.builder().id(docAuditApplyModel.getId())
                        .auditor(docAuditApplyModel.getAuditor()).build();
                docAuditHistoryService.updateById(updateDocAuditHistoryModel);

                for(ValueObjectEntity auditor : auditors){
                    saveCountersignInfo(updateDocAuditHistoryModel, docAuditApplyModel.getProcInstId(), countersign.getTask_id(), task.getTaskDefinitionKey(),
                            auditor.getId(), auditor.getName(), userId, userName, countersign.getReason(), batch + 1, needNotify);
                }
            }
        } else {
            // 其他审核模式下，进行审核加签
            List<DocAuditorDTO> docAuditorDTOList = JSONUtil.toList(JSONUtil.parseArray(docAuditApplyModel.getAuditor()), DocAuditorDTO.class);
            List<DocAuditorDTO> newDocAuditorDTOList = new ArrayList<>();
            List<User> userInfos = new ArrayList<>();
            try {
                userInfos = userManagementService.getUserInfoByIds(String.join(",", auditorIds));
            } catch (Exception e) {
                log.warn("加签，查询加签人员集合信息异常，auditorIds：{}", auditorIds, e);
            }
            for(User user : userInfos){
                DocAuditorDTO newDocAuditorDTO = new DocAuditorDTO();
                newDocAuditorDTO.setId(user.getId());
                newDocAuditorDTO.setName(user.getName());
                newDocAuditorDTO.setAccount(user.getAccount());
                newDocAuditorDTO.setStatus("pending");
                boolean isExist = newDocAuditorDTOList.stream().filter(nd -> nd.getId().equals(user.getId())).findAny().isPresent();
                if(isExist){
                    continue;
                }
                newDocAuditorDTOList.add(newDocAuditorDTO);
            }

            docAuditorDTOList.addAll(newDocAuditorDTOList);
            docAuditApplyModel.setAuditor(JSONUtil.toJsonStr(docAuditorDTOList));
            docAuditApplyService.updateById(docAuditApplyModel);
            DocAuditHistoryModel updateDocAuditHistoryModel = DocAuditHistoryModel.builder().id(docAuditApplyModel.getId())
                    .auditor(docAuditApplyModel.getAuditor()).build();
            docAuditHistoryService.updateById(updateDocAuditHistoryModel);

            for(ValueObjectEntity auditor : auditors){
                boolean result = processInstanceService.addTaskForInstance(auditor.getId(), docAuditApplyModel.getProcInstId());
                if(result){
                    saveCountersignInfo(updateDocAuditHistoryModel, docAuditApplyModel.getProcInstId(), countersign.getTask_id(), task.getTaskDefinitionKey(),
                            auditor.getId(), auditor.getName(), userId, userName, countersign.getReason(), batch + 1, needNotify);
                }
            }
            try {
                this.sendThirdMsgAuditor(docAuditApplyModel, String.join(",", auditorIds), userId, task.getId(), "counter_sign");
            } catch (Exception e) {
                log.warn("加签，发送第三方消息异常，auditorIds：{}", auditorIds, e);
            }
            this.sendAuditorMatchNotify(docAuditApplyModel, task.getProcessInstanceId(), task.getTaskDefinitionKey(), task.getProcessDefinitionId());
        }
        docAuditAfterService.setAttachmentPerm(docAuditApplyModel, auditorIds);
    }

    /**
     * @description 加签判断当同一审核员重复审核同一申请时，是否允许重复审核
     * @param docAuditApplyModel docAuditApplyModel
     * @param auditorIds auditorIds
     */
    private List<String> filterRepeatAuditor(DocAuditApplyModel docAuditApplyModel, List<String> auditorIds){
        List<String> filterUserIds = queryRepeatAuditor(docAuditApplyModel, auditorIds);
        if(auditorIds.size() != filterUserIds.size()){
            List<String> filterResultIds = new ArrayList<>();
            for (String auditorId : auditorIds){
                if(filterUserIds.contains(auditorId)){
                    continue;
                }
                filterResultIds.add(auditorId);
            }
            throw new RestException(BizExceptionCodeEnum.A50001105.getCode(),
                    BizExceptionCodeEnum.A50001105.getMessage(), JSONUtil.parseArray(filterResultIds));
        }
        return filterUserIds;
    }

    /**
     * @description 筛选重复的审核员
     * @param docAuditApplyModel docAuditApplyModel
     * @param auditorIds auditorIds
     * @updateTime 2023/8/14
     * @author siyu.chen
     */
    private List<String> queryRepeatAuditor(DocAuditApplyModel docAuditApplyModel, List<String> auditorIds){
        List<DocShareStrategyAuditor> strategyAuditorList = new ArrayList<>();
        for (String auditorId : auditorIds){
            DocShareStrategyAuditor itemAuditor = new DocShareStrategyAuditor();
            itemAuditor.setUserId(auditorId);
            strategyAuditorList.add(itemAuditor);
        }
        List<DocShareStrategyAuditor> filterRepeatAuditorList = docShareStrategyService.filterRepeatAuditor(docAuditApplyModel.getProcDefId(),
                docAuditApplyModel.getProcInstId(), strategyAuditorList, null);
        return filterRepeatAuditorList.stream().map(DocShareStrategyAuditor::getUserId).collect(Collectors.toList());
    }

    /**
     * @description 保存加签记录信息
     * @param historyModel historyModel
     * @param procInstId procInstId
     * @param taskId taskId
     * @param taskDefKey taskDefKey
     * @param auditor auditor
     * @param auditorName auditorName
     * @param userId userId
     * @param userName userName
     * @param reason reason
     * @param batch batch
     */
    private void saveCountersignInfo(DocAuditHistoryModel historyModel, String procInstId, String taskId, String taskDefKey, String auditor, String auditorName,
                                     String userId, String userName, String reason, int batch, Boolean needNotify){
        CountersignInfo countersignInfo = new CountersignInfo();
        countersignInfo.setProcInstId(procInstId);
        countersignInfo.setTaskId(taskId);
        countersignInfo.setTaskDefKey(taskDefKey);
        countersignInfo.setCountersignAuditor(auditor);
        countersignInfo.setCountersignAuditorName(auditorName);
        countersignInfo.setCountersignBy(userId);
        countersignInfo.setCountersignByName(userName);
        countersignInfo.setReason(reason);
        countersignInfo.setBatch(batch);
        countersignInfo.setCreateTime(new Date());
        countersignInfoService.save(countersignInfo);
                                    
        if (!needNotify) {
            return;
        }
        // 记录日志
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getById(historyModel.getId());
        String ip = "";
        try {
            HttpServletRequest request = RequestUtils.getRequest();
            if (RequestUtils.getRequest() != null) {
                ip = RequestUtils.getIpAddress(request);
            }
        } catch (Exception e) {}
        docAuditSubmitService.recordCountersignLog(docAuditHistoryModel, ip, userId, auditorName, userName);

        // 发送邮件
        sendCountersignEmail(docAuditHistoryModel, procInstId, auditor, reason);
    }

    /**
     * @description 加签发送审核员邮件
     * @param procInstId procInstId
     * @param auditorId auditorId
     * @updateTime 2023/2/23
     */
    private void sendCountersignEmail(DocAuditHistoryModel docAuditHistoryModel, String procInstId, String auditorId, String reason){
        try {
            ProcessInstanceModel processInstance = processInstanceService.getProcessInstanceById(procInstId);
            DocAuditApplyModel docAuditApplyModel = docAuditApplyService.getById(docAuditHistoryModel.getId());
            ProcessInputModel processInputModel = new ProcessInputModel();
            Map<String, Object> fields = Maps.newHashMap();
            fields.put("id", docAuditApplyModel.getId());
            fields.put("type", docAuditApplyModel.getApplyType());
            fields.put("bizType", docAuditApplyModel.getBizType());
            fields.put("docName", docAuditApplyModel.getDocPath());
            fields.put("applyUserName", docAuditApplyModel.getApplyUserName());
            fields.put("frontPluginJsonStr", auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType()));
            fields.put("isArbitraily", null != JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") ? true : false);
            JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
            fields.put("flowName", detail.containsKey("flowName") ? detail.get("flowName") : "");
            fields.put("docNames", docAuditApplyModel.getDocNames());
            fields.put("counterSignMsg", reason);

            processInputModel.setFields(fields);
            JSONObject applyDetailJsonObj = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
            if(applyDetailJsonObj.containsKey("workflow")){
                fields.put("workflow", JSONUtil.toJsonStr(JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow")));
            }

            boolean isArbitraily = (boolean) fields.get("isArbitraily");
            DocAuditBizService docAuditBizService = ApplicationContextHolder.getBean(
                    DocConstants.DOC_AUDIT_BIZ_SERVICE_PRFIX + (isArbitraily ? "" : docAuditApplyModel.getBizType()), DocAuditBizService.class);
            docAuditBizService.submitProcessBefore(processInputModel, docAuditApplyModel);

            processInstance.setStartUserId(docAuditHistoryModel.getApplyUserId());
            processInstance.setProcessInputModel(processInputModel);

            String type = processInstance.getProcessInputModel().getFields().get("type").toString();
            AbstractEmailService service = ApplicationContextHolder
                    .getBean("email_to_" + (isArbitraily ? "arbitraily" : type), AbstractEmailService.class);
            service.sendCountersignAuditorEmail(processInstance, auditorId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * @description 记录审核加签日志
     * @param history history
     * @param ip ip
     * @param userId userId
     * @param auditorName auditorName
     * @param userName userName
     */
    @OperationLog(title = OperationLogConstants.COUNTERSIGN_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    public void recordCountersignLog(DocAuditHistoryModel history, String ip, String userId, String auditorName, String userName) {

    }

    /**
     * @description 批量根据流程实例ID作废流程
     * @author ouandyang
     * @param  procInstIds 流程实例ID
     * @updateTime 2021/6/9
     */
    public void arbitrarilyBatchCancel(List<String> procInstIds,String userId,String reason){
        try {
            processInstanceService.processInstanceBatchCancel(procInstIds, userId, reason);
        } catch (Exception e) {
            log.warn("processInstanceBatchCancel error,procInstIds:"+procInstIds, e);
        }
        List<DocAuditApplyModel> list = docAuditApplyService.list(new LambdaQueryWrapper<DocAuditApplyModel>()
                .in(DocAuditApplyModel::getProcInstId, procInstIds));
        List<String> ids = list.stream().map(item -> item.getId()).collect(Collectors.toList());
        DocAuditHistoryModel docAuditHistoryModel = DocAuditHistoryModel.builder()
                .auditStatus(AuditStatusEnum.CANCEL.getValue())
                .lastUpdateTime(new Date()).build();
        docAuditHistoryService.update(docAuditHistoryModel, new LambdaUpdateWrapper<DocAuditHistoryModel>()
                .in(DocAuditHistoryModel::getId, ids));
        docAuditApplyService.removeByIds(ids);
        docAuditHistoryService.batchUpdateHisTaskStatus(docAuditHistoryModel.getAuditStatus(), procInstIds);
        for (DocAuditApplyModel docAuditApplyModel : list) {
            //文档流转作废流程给申请人发送邮件
            if(reason.equals(DocConstants.FLOW_DEL_FILE_CANCEL) || DocConstants.USER_DELETED.equals(reason)){
                flowApplySendEmail(docAuditApplyModel);
            }
            // 发送NSQ拒绝消息
            sendAuditNotify(docAuditApplyModel.getBizId(),DocConstants.AUDIT_STATUS_CANCEL,docAuditApplyModel.getBizType(),docAuditApplyModel.getApplyType());
        }
    }

    /**
     * @description 任意审核模块主动撤销流程
     * @param  applyId 申请ID
     * @param  userId 用户ID
     * @param  reason 撤销原因
     */
    @OperationLog(title = OperationLogConstants.DOC_AUDIT_UNDONE_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    public void arbitrarilyBatchRevocation(String applyId, String userId, String reason){
        DocAuditApplyModel docAuditApplyModel = this.cancelByBizId(applyId, userId,
                AuditStatusEnum.UNDONE.getValue(), reason, true);

        if (docAuditApplyModel == null) {
            log.warn("applyId不存在", applyId);
            return;
        }

        ProcessInstanceModel processInstance = this.setRevocationFields(docAuditApplyModel);
        ProcessInputModel model = processInstance.getProcessInputModel();
        Map<String, Object> fields = model.getFields();
        fields.put("isRevocation", true);
        fields.put("deleteReason", reason);

        model.setFields(fields);
        processInstance.setStartUserId(docAuditApplyModel.getApplyUserId());
        processInstance.setProcessInputModel(model);
        ProcessDefinitionModel oldProcDefModel = processDefinitionService.getProcessDef(docAuditApplyModel.getProcDefId());
        processInstance.setProcessDefinition(oldProcDefModel);
        String handlerId = StrUtil.isEmpty(userId) ? WorkflowConstants.ZERO_ROLE : userId;
        docAuditMsgNotice.updateTodoMessage(processInstance, handlerId, null);
        nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_MSG, JSONUtil.toJsonStr(processInstance));
    }

    /**
     * @description 发送nsq消息
     * @author xiashenghui
     * @param  auditType 流程类型
     * @param  bizId 申请ID
     * @param auditStatusCancel 审核状态
     * @updateTime 2021/10/9
     */
    private void sendAuditNotify(String bizId, String auditStatusCancel, String auditType, String applyType) {
        nsqSenderService.sendAuditNotify(NsqConstants.WORKFLOW_AUDIT_RESULT + "." + auditType, bizId, auditStatusCancel, new ArrayList<>());
        if (DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(auditType)) {
			nsqSenderService.sendAuditNotify(NsqConstants.WORKFLOW_AUDIT_RESULT + "." + applyType, bizId, auditStatusCancel, new ArrayList<>());
		}
    }

    /**
     * @description 转审
     * @author siyu.chen
     * @param  applyId 申请id
     * @param  userId 用户id
     * @param transfer 转审参数
     * @updateTime 2021/10/9
     */
    public void transferByApplyId(String applyId, String userId, Transfer transfer, Boolean needNotify) {
        DocAuditApplyModel docAuditApplyModel = docAuditApplyService.selectByBizId(applyId);
        if(null == docAuditApplyModel){
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(),
                    BizExceptionCodeEnum.A401001101.getMessage());
        }
        Task task = null;
        try{
            task = processInstanceService.getProcessTask(docAuditApplyModel.getProcInstId(), userId);
        } catch (Exception e) {
            log.warn("通过申请ID执行审核转审，当前待办任务未找到，procInstId：{}，userId：{}", docAuditApplyModel.getProcInstId(), userId);
        }
        if (task == null) {
            throw new RestException(BizExceptionCodeEnum.A401001101.getCode(), BizExceptionCodeEnum.A401001101.getMessage());
        }
        String customDescriptionJsonStr = task.getDescription();
        if(StrUtil.isEmpty(customDescriptionJsonStr)){
            throw new InternalException(BizExceptionCodeEnum.A500057001.getCode(),  BizExceptionCodeEnum.A500057001.getMessage());
        }
        // 查看转审是否开启
        JSONObject customDescriptionJson = JSONUtil.parseObj(customDescriptionJsonStr);
        JSONObject transferConfig = JSONUtil.parseObj(customDescriptionJson.getStr("transfer"));
        if (transferConfig.isEmpty()) {
            throw new NotFoundException(BizExceptionCodeEnum.A404057002.getCode(), BizExceptionCodeEnum.A404057002.getMessage());
        }
        String transferSwitch = transferConfig.getStr("transferSwitch");
        if (transferSwitch.equals("N")) {
            throw new ForbiddenException(BizExceptionCodeEnum.A403057005.getCode(), BizExceptionCodeEnum.A403057005.getMessage());
        }
        // 被转审人与转审人是否相同
        if (userId.equals(transfer.getAuditor())){
            throw new ForbiddenException(BizExceptionCodeEnum.A403057007.getCode(), BizExceptionCodeEnum.A403057007.getMessage());
        }
        // 获取加签信息，如果流程存在加签，加签的信息在审核通过后会被覆盖导致转审操作失败
        // 因此需要手动将审核员的信息组装，此处获取的时t_wf_hi_taskinst表中某一流程下的所有审核员信息
        List<DocAuditHistoryModel> docAuditHistoryList = docAuditHistoryService.selectAuditTaskByApplyIDAndTaskDefKey(docAuditApplyModel.getId(), task.getTaskDefinitionKey());
        Map<String, List<DocAuditHistoryModel>> processAuditorMap = docAuditHistoryList.stream().collect(Collectors.groupingBy(DocAuditHistoryModel::getProcDefName));
        List<DocAuditHistoryModel> hiAuditors = processAuditorMap.get(task.getTaskDefinitionKey());
        JSONArray auditorList = JSONUtil.parseArray(docAuditApplyModel.getAuditor());
        Map<String, String> auditorMap = new HashMap<>();
        for (Object auditor : auditorList) {
            JSONObject auditorObj = JSONUtil.parseObj(auditor);
            auditorMap.put(auditorObj.getStr("id"), "");
        }
        for (DocAuditHistoryModel hiAuditor : hiAuditors) {
            if (auditorMap.containsKey(hiAuditor.getAuditor()) || StrUtil.isBlank(hiAuditor.getAuditor()) ||
                (StrUtil.isNotBlank(hiAuditor.getAuditResult()) && WorkFlowContants.ACTION_TYPE_RECEIVER_TRANSFER.equals(hiAuditor.getAuditResult()))) {
                continue;
            }
            JSONObject jsonObject = new JSONObject();
            jsonObject.set("name", hiAuditor.getAssigneeOrgId());
            jsonObject.set("id", hiAuditor.getAuditor());
            jsonObject.set("account", hiAuditor.getAssigneeOrgId());
            jsonObject.set("status", StrUtil.isBlank(hiAuditor.getAuditResult()) ? "pending" : "pass");
            if (StrUtil.isNotBlank(hiAuditor.getAuditResult())) {
                jsonObject.set("auditDate", CommonUtils.dateToStamp(hiAuditor.getLastUpdateTime()));
            }
            auditorList.add(jsonObject);
        }
        // 被转审人是否在审核列表中
        for (Object audit : auditorList) {
            JSONObject auditorObj = JSONUtil.parseObj(audit);
            if (transfer.getAuditor().equals(auditorObj.getStr("id")) && "pending".equals(auditorObj.getStr("status"))){
                throw new ForbiddenException(BizExceptionCodeEnum.A403057008.getCode(), BizExceptionCodeEnum.A403057008.getMessage());
            }
        }

        String maxCount = transferConfig.getStr("maxCount");
        // 获取已转审用户信息
        List<TransferInfo> transferInfoList = transferInfoService.list(new LambdaQueryWrapper<TransferInfo>().eq(TransferInfo::getProcInstId, docAuditApplyModel.getProcInstId()));
        Map<String, List<TransferInfo>> transferInfoMap = transferInfoList.stream().collect(Collectors.groupingBy(TransferInfo::getTaskDefKey, Collectors.collectingAndThen(Collectors.toList(),
            list -> {
                list.sort(Comparator.comparingInt(TransferInfo::getBatch).reversed());
                return list;
            }
        )));
        List<TransferInfo> sortedTransferInfoList = transferInfoMap.get(task.getTaskDefinitionKey());
        sortedTransferInfoList = sortedTransferInfoList == null ? new ArrayList<>() : sortedTransferInfoList;
        int batch = 0;
        if(sortedTransferInfoList.size() > 0){
            batch = sortedTransferInfoList.get(0).getBatch();
        }
        
        // 最大转审次数判断
        if(batch > Integer.valueOf(maxCount)){
            throw new ForbiddenException(BizExceptionCodeEnum.A403057009.getCode(), BizExceptionCodeEnum.A403057009.getMessage());
        }
        String transferAuditor = transfer.getAuditor();
        // 被转审人是否已存在转审人列表内
        for (TransferInfo transferInfo : transferInfoList) {
            if (transferAuditor.equals(transferInfo.getTransferBy())){
                throw new ForbiddenException(BizExceptionCodeEnum.A403057006.getCode(), BizExceptionCodeEnum.A403057006.getMessage());
            }
        }
        // 高级配置之审核一次，转审判断当同一审核员重复审核同一申请时，不允许重复审核
        List<String> auditorIds = new ArrayList<>();
        auditorIds.add(transfer.getAuditor());
        auditorIds = queryRepeatAuditor(docAuditApplyModel, auditorIds);
        if(auditorIds.size() == 0){
            Map<String, Object> errInfo = new HashMap<>();
            errInfo.put("auditor", transfer.getAuditor());
            throw new ForbiddenException(BizExceptionCodeEnum.A403057010.getCode(),BizExceptionCodeEnum.A403057010.getMessage(), errInfo);
        }
        // 更新apply history表
        // 构建新的审核员列表
        List<DocAuditorDTO> docAuditorDTOList = JSONUtil.toList(auditorList, DocAuditorDTO.class);
        List<DocAuditorDTO> newDocAuditorDTOList = new ArrayList<>();
        TransferInfo transferInfo = new TransferInfo();
        for(DocAuditorDTO docAuditorDTO : docAuditorDTOList){
            DocAuditorDTO newDocAuditorDTO = new DocAuditorDTO();
            if (!userId.equals(docAuditorDTO.getId())){
                newDocAuditorDTO.setId(docAuditorDTO.getId());
                newDocAuditorDTO.setName(docAuditorDTO.getName());
                newDocAuditorDTO.setAccount(docAuditorDTO.getAccount());
                newDocAuditorDTO.setStatus(docAuditorDTO.getStatus());
                newDocAuditorDTO.setAuditDate(docAuditorDTO.getAuditDate());
            }else{
                List<User> userInfos =new ArrayList<>();
                try {
                    userInfos = userManagementService.getUserInfoByIds(transfer.getAuditor());
                } catch (Exception e) {
                    log.warn("获取用户信息失败-userManagementService异常, 用户ID: {}, detail: {}", transfer.getAuditor(), e.getMessage());
                    SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, "获取用户信息失败-userManagementService异常", e);
                    if (e.getMessage().contains("404019001")){
                        Map<String, Object> detailMap = Maps.newHashMap();
                        detailMap.put("auditor", transfer.getAuditor());
                        throw new NotFoundException(BizExceptionCodeEnum.A400057001.getCode(),BizExceptionCodeEnum.A400057001.getMessage(), detailMap);
                    }
                    throw new InternalException(BizExceptionCodeEnum.A500001000.getCode(),BizExceptionCodeEnum.A500001000.getMessage());
                }
                User userInfo = userInfos.get(0);
                newDocAuditorDTO.setId(userInfo.getId());
                newDocAuditorDTO.setName(userInfo.getName());
                newDocAuditorDTO.setAccount(userInfo.getAccount());
                newDocAuditorDTO.setStatus("pending");

                // 保存转审人信息
                Integer transferBatch = batch + 1;
                transferInfo.setId(IdUtil.randomUUID());
                transferInfo.setProcInstId(task.getProcessInstanceId());
                transferInfo.setTaskDefKey(task.getTaskDefinitionKey());
                transferInfo.setTaskId(task.getId());
                transferInfo.setTransferAuditor(transfer.getAuditor());
                transferInfo.setTransferAuditorName(userInfo.getName());
                transferInfo.setTransferBy(userId);
                transferInfo.setTransferByName(docAuditorDTO.getName());
                transferInfo.setReason(transfer.getReason());
                transferInfo.setBatch(transferBatch);
                transferInfo.setCreateTime(new Date());
            }
            newDocAuditorDTOList.add(newDocAuditorDTO);
        }
        try {
            String topExecutionId = docAuditHistoryService.selectTopExecutionIDByID(task.getId());
            processInstanceService.againSetTaskAuditor(task.getId(), userId, transfer.getAuditor(), topExecutionId);
        } catch (Exception e) {
            log.warn("转审失败, 任务ID: {}, 转审人: {}, 被转审人: {}, detail: {}", task.getId(), userId, transfer.getAuditor(), e);
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, "转审失败-服务异常", e);
            throw new InternalException(BizExceptionCodeEnum.A500001000.getCode(),BizExceptionCodeEnum.A500001000.getMessage());
        }
        docAuditApplyModel.setAuditor(JSONUtil.toJsonStr(newDocAuditorDTOList));
        docAuditApplyService.updateById(docAuditApplyModel);
        DocAuditHistoryModel updateDocAuditHistoryModel = DocAuditHistoryModel.builder().id(docAuditApplyModel.getId())
                        .auditor(docAuditApplyModel.getAuditor()).build();
        docAuditHistoryService.updateById(updateDocAuditHistoryModel);
        HistoricTaskInstanceEntity historicTaskInstanceEntity = (HistoricTaskInstanceEntity) processInstanceService.getHistoryService()
            .createHistoricTaskInstanceQuery().executionId(task.getExecutionId()).taskAssignee(transfer.getAuditor()).singleResult();
        // 转审后重置 messageId 为空字符串
        docAuditHistoryService.updateHisTaskMessageId("", historicTaskInstanceEntity.getId());
        // 手动插入获取转审后的historytask记录信息
        historicTaskInstanceEntity.setId(IdUtil.randomUUID());
        historicTaskInstanceEntity.setAssignee(userId);
        historicTaskInstanceEntity.setDeleteReason(WorkFlowContants.ACTION_TYPE_RECEIVER_TRANSFER);
        historicTaskInstanceEntity.setEndTime(new Date());
        historicTaskInstanceEntity.setStatus("7");
        historicTaskInstanceEntity.setAssigneeOrgId(task.getAssigneeOrgId());
        historicTaskInstanceEntity.setProcessDefinitionName(task.getProcessDefinitionName());
        docAuditHistoryService.insertHiTaskinst(historicTaskInstanceEntity);
        transferInfoService.save(transferInfo);
        Runnable run = () -> {
            if (!needNotify) {
                return;
            }
            transferAfter(updateDocAuditHistoryModel, userId, transferInfo, historicTaskInstanceEntity.getMessageId());
        };
        executor.execute(run);
        List<String> toBeSetPermAuditor = new ArrayList<>();
        toBeSetPermAuditor.add(transfer.getAuditor());
        docAuditAfterService.setAttachmentPerm(docAuditApplyModel, toBeSetPermAuditor);
        try {
            this.sendThirdMsgAuditor(docAuditApplyModel, transferInfo.getTransferAuditor(), userId, task.getId(), "transfer");
        } catch (Exception e) {
            log.warn("转审，发送第三方消息异常，auditorIds：{}", transferInfo.getTransferAuditor(), e);
        }
        this.sendAuditorMatchNotify(docAuditApplyModel, task.getProcessInstanceId(), task.getTaskDefinitionKey(), task.getProcessDefinitionId());
    }

    private void sendThirdMsgAuditor(DocAuditApplyModel docAuditApplyModel, String auditorIds, String userId, String curActInstId, String optType){
        ProcessInstanceModel processInstanceModel = processInstanceService.getProcessInstanceById(docAuditApplyModel.getProcInstId());
        Map<String, Object> variables = processInstanceService.getProcessInstanceVariables(docAuditApplyModel.getProcInstId());
        ProcessInputModel processInputModel = (ProcessInputModel) variables.get("wf_processInputModel");
        String procDefKey = processInputModel.getWf_procDefKey();
        if (StrUtil.isEmpty(procDefKey)) {
            procDefKey = processInputModel.getWf_procDefId().split(":")[0];
        }
        ProcessDefinitionModel processDefinitionModel = processDefinitionService.getProcessDefBykey(procDefKey, processInstanceModel.getTenantId());
        Map<String, Object> fileds = processInputModel.getFields();
        fileds.put("cur_auditors", auditorIds);
        fileds.put("userId", userId);
        fileds.put("opt_type", optType);
        processInputModel.setFields(fileds);
        processInstanceModel.setProcessInputModel(processInputModel);
        processInstanceModel.setProcessDefinition(processDefinitionModel);
        processInputModel.setWf_curActInstId(curActInstId);
        docAuditMsgNotice.sendCounterSignOrTransferMsgAuditor(processInstanceModel);
    }

    /**
     * @description 记录审核转审日志
     * @param history history
     * @param ip ip
     * @param userId userId
     * @param auditorName auditorName
     * @param userName userName
     */
    @OperationLog(title = OperationLogConstants.Transfer_LOG, level = OperationLogConstants.LogLevel.NCT_LL_INFO)
    public void recordTransferLog(DocAuditHistoryModel history, String ip, String userId, String auditorName, String assigneeTo) {

    }

    private void transferAfter(DocAuditHistoryModel historyModel, String userId, TransferInfo transferInfo, String messageId) {
        // 记录日志
        String ip = "";
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getById(historyModel.getId());
        try {
            HttpServletRequest request = RequestUtils.getRequest();
            if (RequestUtils.getRequest() != null) {
                ip = RequestUtils.getIpAddress(request);
            }
        } catch (Exception e) {}
        docAuditSubmitService.recordTransferLog(docAuditHistoryModel, ip, userId, transferInfo.getTransferByName(), transferInfo.getTransferAuditorName());

        // 发送邮件
        ProcessInstanceModel processInstance = processInstanceService.getProcessInstanceById(docAuditHistoryModel.getProcInstId());
        ProcessInputModel processInputModel = new ProcessInputModel();
        Map<String, Object> fields = Maps.newHashMap();
        JSONObject applyDetail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        Object docs = applyDetail.get("docs");
        Boolean isArbitraily = null != applyDetail.get("workflow") ? true : false;
        fields.put("id", docAuditHistoryModel.getId());
        fields.put("type", docAuditHistoryModel.getApplyType());
        fields.put("applyId", docAuditHistoryModel.getBizId());
        fields.put("bizType", docAuditHistoryModel.getBizType());
        fields.put("docName", docAuditHistoryModel.getDocPath());
        fields.put("applyUserName", docAuditHistoryModel.getApplyUserName());
        fields.put("frontPluginJsonStr", auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType()));
        fields.put("isArbitraily", isArbitraily);
        fields.put("isTransfer", true);
        fields.put("docNames", docAuditHistoryModel.getDocNames());
        fields.put("transferMsg", transferInfo.getReason());
        if(isArbitraily){
            fields.put("data", applyDetail.get("data"));
        }
        if(docs != null) {
            fields.put("docs", docs);
        }
        processInputModel.setFields(fields);
        processInstance.setProcessInputModel(processInputModel);
        ProcessDefinitionModel procDefModel = processDefinitionService.getProcessDef(docAuditHistoryModel.getProcDefId());
        processInstance.setProcessDefinition(procDefModel);
        String type = processInstance.getProcessInputModel().getFields().get("type").toString();
        AbstractEmailService service = ApplicationContextHolder
                .getBean("email_to_" + (isArbitraily ? "arbitraily" : type), AbstractEmailService.class);
        try {
            docAuditMsgNotice.updateTodoMessage(processInstance, userId, messageId);
            service.sendTransferAuditorEmail(processInstance, transferInfo.getTransferAuditor());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * @description 发送审核员匹配消息
     * @param DocAuditApplyModel docAuditApplyModel
     * @param Object obj 审核员id
     * @param String operation 转审和加签操作
     */
    private void sendAuditorMatchNotify(DocAuditApplyModel docAuditApplyModel, String processInstanceId, String curActDefId, String processDefinitionId) {
        // 发送匹配到审核员消息
        Map<String,Object> map = new HashMap<>();
		map.put("apply_id", docAuditApplyModel.getBizId());
        List<Task> tasks = processInstanceService.getProcessTasks(processInstanceId, curActDefId);
        List<String> auditorList = tasks.stream().map(Task::getAssignee).distinct().collect(Collectors.toList()); // 转换为列表
        map.put("auditors", auditorList.toArray(new String[0]));
        Map<String,Object> advanceConfig = new HashMap<>();
        try{
            DocShareStrategy docShareStrategy = docShareStrategyService.getShareStrategy(processDefinitionId, curActDefId);
            StrategyConfigsDTO strategyConfigs = JSON.parseObject(docShareStrategy.getStrategyConfigs(), StrategyConfigsDTO.class);
            advanceConfig.put("edit_perm_switch", strategyConfigs != null && strategyConfigs.getEditPermSwitch() != null? strategyConfigs.getEditPermSwitch() : false);
        }catch (Exception e){
            advanceConfig.put("edit_perm_switch", false);
            log.warn("匹配审核员消息，获取流程配置信息失败", e);
        }
        map.put("advance_config", advanceConfig);
        nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_AUDITOR + "." + docAuditApplyModel.getBizType(), JSONUtil.toJsonStr(map));
        if (DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(docAuditApplyModel.getBizType())) {
			nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_AUDITOR + "." + docAuditApplyModel.getApplyType(), JSONUtil.toJsonStr(map));
		}
    }

    private ProcessInstanceModel setRevocationFields(DocAuditApplyModel docAuditApplyModel) {
        ProcessInstanceModel processInstance = null;
        ProcessInputModel model = null;
        Map<String, Object> fields = null;
        try {
            processInstance = processInstanceService.getProcessInstanceById(docAuditApplyModel.getProcInstId());
            model = processInstance.getProcessInputModel() == null ? new ProcessInputModel() : processInstance.getProcessInputModel();
            fields = model.getFields() == null ? Maps.newHashMap() : model.getFields();
            // 添加第三方撤销消息字段
            fields.put("applyId",docAuditApplyModel.getId());
            fields.put("bizType",docAuditApplyModel.getBizType());
            fields.put("applyUserId",docAuditApplyModel.getApplyUserId());
            fields.put("docCsfLevel",docAuditApplyModel.getCsfLevel());
            fields.put("docId",docAuditApplyModel.getDocId());
            fields.put("docName",docAuditApplyModel.getDocNames());
            fields.put("docNames",docAuditApplyModel.getDocNames());
            fields.put("docType",docAuditApplyModel.getDocType());
        } catch (Exception e) {
            log.warn("流程撤销，发送第三方消息异常", e);
            processInstance = new ProcessInstanceModel();
            model = new ProcessInputModel();
            fields = Maps.newHashMap();
        }
        fields.put("type", docAuditApplyModel.getApplyType());
        JSONObject applyDetailObj = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        if (applyDetailObj.get("workflow") == null){
            fields.put("isArbitraily", false);
        }else{
            fields.put("isArbitraily", true);
            fields.put("data", applyDetailObj.get("data"));
        }
        fields.put("bizId", docAuditApplyModel.getBizId());
        model.setFields(fields);
        // 审核撤销不设置发起人id
        processInstance.setStartUserId(null);
        processInstance.setProcState(AuditStatusEnum.getValueByCode("undone").toString());
        processInstance.setProcInstId(docAuditApplyModel.getProcInstId());
        processInstance.setBusinessKey(docAuditApplyModel.getId());
        processInstance.setProcessInputModel(model);
        return processInstance;
    }
}