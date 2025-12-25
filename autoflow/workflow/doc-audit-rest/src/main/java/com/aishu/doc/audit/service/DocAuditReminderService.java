package com.aishu.doc.audit.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.vo.DocAuditReminderParam;
import com.aishu.doc.audit.vo.ReminderVO;
import com.aishu.doc.email.AbstractEmailService;
import com.aishu.doc.email.common.EmailUtils;
import com.aishu.doc.msg.service.DocAuditMsgNotice;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.ForbiddenException;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.RedisLockUtil;
import com.aishu.wf.core.common.util.RedisUtil;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.google.common.collect.Maps;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 审核催办服务类
 * @author siyu.chen
 */
@Slf4j
@Service
public class DocAuditReminderService {
    @Autowired
    private RedisLockUtil redisLock;
    @Autowired
    private RedisUtil redisUtil;
    @Autowired
    DocAuditHistoryService docAuditHistoryService;
    @Autowired
    DocAuditApplyService docAuditApplyService;
    @Autowired
    ProcessInstanceService processInstanceService;
    @Autowired
    DocAuditMsgNotice docAuditMsgNotice;
    @Autowired
    AuditConfig auditConfig;
    @Autowired
    private ThreadPoolTaskExecutor executor;

    public void reminder(DocAuditHistoryModel docAuditHistoryModel, DocAuditReminderParam docAuditReminderParam) {
        if (docAuditHistoryModel.getAuditStatus() != 1) {
            throw new ForbiddenException(BizExceptionCodeEnum.A403057004.getCode(),
                    BizExceptionCodeEnum.A403057004.getMessage());
        }
        String taskDefKey = docAuditApplyService.selectTaskDefKeyByApplyID(docAuditHistoryModel.getId());
        List<String> auditorsList = Arrays.asList(docAuditReminderParam.getAuditors());
        List<DocAuditHistoryModel> auditors = docAuditHistoryService
            .selectAuditTaskByApplyIDAndTaskDefKey(docAuditHistoryModel.getId(), taskDefKey);
        // 筛选存在的审核员
        List<String> existAuditorsList = auditors.stream().map(DocAuditHistoryModel::getAuditor).collect(Collectors.toList());
        auditorsList = auditorsList.stream().filter(auditor ->existAuditorsList.contains(auditor)).collect(Collectors.toList());
        // 所有审核员都不存在抛错
        if (auditorsList.size() ==0){
            throw new ForbiddenException(BizExceptionCodeEnum.A403057003.getCode(), BizExceptionCodeEnum.A403057003.getMessage());
        }
        List<String> auditorIDs = new ArrayList<>();
        for (String auditorID : auditorsList) {
            for (DocAuditHistoryModel auditor : auditors) {
                // 逐级当前用户已审核完成，直接报错
                String auditResult = auditor.getAuditResult();
                if (!StrUtil.isEmpty(auditResult) && auditor.getAuditor().equals(auditorID) && docAuditHistoryModel.getAuditType().equals("zjsh")) {
                    throw new ForbiddenException(BizExceptionCodeEnum.A403057001.getCode(),BizExceptionCodeEnum.A403057001.getMessage());
                }
                if (StrUtil.isEmpty(auditResult) && auditor.getAuditor().equals(auditorID)) {
                    auditorIDs.add(auditorID);
                    break;
                }
            }
        }
        // 查询redis，十分钟催办一次
        String lockKey = docAuditHistoryModel.getId() + ":" +taskDefKey;
        String lockValue = auditorIDs.toString();
        if (docAuditHistoryModel.getAuditType().equals("zjsh")) {
            lockKey = lockKey + ":" +auditorIDs.get(0);
        }
        // redis需要解锁可能存在并发问题，所以需要额外添加锁防止并发重复发送邮件
        String reqLockKey = lockKey + ":lock";
        String reqLockValue = redisUtil.get(reqLockKey);
        if (StrUtil.isNotBlank(reqLockValue)) {
            throw new ForbiddenException(BizExceptionCodeEnum.A403057011.getCode(), BizExceptionCodeEnum.A403057011.getMessage());
        }
        try{
            redisLock.lock(reqLockKey, "", 3);
            String value = redisUtil.get(lockKey);
            if (StrUtil.isNotBlank(value)) {
                if (docAuditHistoryModel.getAuditType().equals("tjsh")) {
                    List<String> auditorInLockList = JSONUtil.toList(JSONUtil.parseArray(value),String.class);
                    // 同级情况下，列表中未催办审核员
                    auditorIDs = auditorIDs.stream().filter(auditor -> !auditorInLockList.contains(auditor)).collect(Collectors.toList());
                    if (auditorIDs.size() == 0){
                        throw new ForbiddenException(BizExceptionCodeEnum.A403057002.getCode(), BizExceptionCodeEnum.A403057002.getMessage());
                    }
                    redisLock.unlock(lockKey, value);
                    auditorInLockList.addAll(auditorIDs);
                    lockValue = auditorInLockList.toString();
                }else{
                    throw new ForbiddenException(BizExceptionCodeEnum.A403057002.getCode(), BizExceptionCodeEnum.A403057002.getMessage());
                }
            }
            if (auditorIDs.size() > 0) {
                redisLock.lock(lockKey, lockValue, 600);
                String remark = docAuditReminderParam.getRemark() == null ? "" : docAuditReminderParam.getRemark();
                asynSendemail(docAuditHistoryModel, auditorIDs, remark, lockKey, lockValue);
                asyncSendNotification(docAuditHistoryModel, auditorIDs, remark);
            }else{
                // 无审核员
                throw new ForbiddenException(BizExceptionCodeEnum.A403057003.getCode(), BizExceptionCodeEnum.A403057003.getMessage());
            }
        } finally{
            redisLock.unlock(reqLockKey, "");
        }
    }

    public ReminderVO reminderStatus(DocAuditHistoryModel docAuditHistoryModel) {
        if (docAuditHistoryModel.getAuditStatus() != 1) {
            throw new ForbiddenException(BizExceptionCodeEnum.A403057004.getCode(),
                    BizExceptionCodeEnum.A403057004.getMessage());
        }
        String taskDefKey = docAuditApplyService.selectTaskDefKeyByApplyID(docAuditHistoryModel.getId());
        String lockKey = docAuditHistoryModel.getId() + ":" +taskDefKey;
        if (docAuditHistoryModel.getAuditType().equals("zjsh")) {
            List<DocAuditHistoryModel> auditors = docAuditHistoryService.selectAuditTaskByApplyIDAndTaskDefKey(docAuditHistoryModel.getId(), taskDefKey);
            List<String> existAuditorsList = auditors.stream().filter(auditor -> StrUtil.isEmpty(auditor.getAuditResult())).map(DocAuditHistoryModel::getAuditor).collect(Collectors.toList());
            lockKey = lockKey + ":" +existAuditorsList.get(0);
        }
        String value = redisUtil.get(lockKey);
        ReminderVO reminderVO = new ReminderVO();
        if (StrUtil.isNotBlank(value)) {
            if (docAuditHistoryModel.getAuditType().equals("tjsh")) {
                // 筛选存在的审核员
                List<DocAuditHistoryModel> auditors = docAuditHistoryService.selectAuditTaskByApplyIDAndTaskDefKey(docAuditHistoryModel.getId(), taskDefKey);
                List<String> existAuditorsList = auditors.stream().filter(auditor -> StrUtil.isEmpty(auditor.getAuditResult())).map(DocAuditHistoryModel::getAuditor).collect(Collectors.toList());
                List<String> auditorInLockList = JSONUtil.toList(JSONUtil.parseArray(value),String.class);
                reminderVO.setStatus(areListsEqualIgnoringOrder(existAuditorsList, auditorInLockList) ? true : false);
            }else{
                reminderVO.setStatus(true);
            }
            return reminderVO;
        }
        reminderVO.setStatus(false);
        return reminderVO;
    }

    public static boolean areListsEqualIgnoringOrder(List<String> list1, List<String> list2) {
        if (list1.size() != list2.size()) {
            return false;
        }

        Collections.sort(list1);
        Collections.sort(list2);

        return list1.equals(list2);
    }

    public void asyncSendNotification(DocAuditHistoryModel docAuditHistoryModel, List<String> auditorIds, String remark) {

        Runnable run = () -> {
            ProcessInstanceModel processInstance = processInstanceService.getProcessInstanceById(docAuditHistoryModel.getProcInstId());
            docAuditMsgNotice.sendRemindMessage(processInstance, auditorIds, remark);
        };
        executor.execute(run);
    }

    public void asynSendemail(DocAuditHistoryModel docAuditHistoryModel, List<String> auditorIds, String remark, String lockKey, String value) {
        Runnable run = () -> {
            try {
                ProcessInstanceModel processInstance = processInstanceService.getProcessInstanceById(docAuditHistoryModel.getProcInstId());
                ProcessInputModel processInputModel = new ProcessInputModel();
                Map<String, Object> fields = Maps.newHashMap();
                fields.put("remark", EmailUtils.substring(remark, 130));
                fields.put("id", docAuditHistoryModel.getId());
                fields.put("type", docAuditHistoryModel.getApplyType());
                fields.put("bizType", docAuditHistoryModel.getBizType());
                fields.put("docName", docAuditHistoryModel.getDocPath());
                fields.put("applyUserName", docAuditHistoryModel.getApplyUserName());
                fields.put("frontPluginJsonStr", auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType()));
                fields.put("isArbitraily", null != JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") ? true : false);
                fields.put("docNames", docAuditHistoryModel.getDocNames());
                processInputModel.setFields(fields);
                processInstance.setProcessInputModel(processInputModel);
                Boolean isArbitraily = null != JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).get("workflow") ? true : false;
                String type = processInstance.getProcessInputModel().getFields().get("type").toString();
                AbstractEmailService service = ApplicationContextHolder
                        .getBean("email_to_" + (isArbitraily ? "arbitraily" : type), AbstractEmailService.class);
                service.sendReminderAuditorEmail(processInstance ,auditorIds);
            } catch (Exception e) {
                // 异步发送邮件失败，需要解锁保证失败能重新催办
                log.warn("异步催办邮件服务-发送邮件异常！processInstance:", e);
                SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, "异步催办邮件服务-发送邮件异常", e);
                if (StrUtil.isBlank(lockKey)) {
                    return;
                }
                redisLock.unlock(lockKey, value);
            }
        };
        executor.execute(run);
    }
}
