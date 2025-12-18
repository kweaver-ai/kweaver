package com.aishu.doc.monitor;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.common.DocAuditCommonService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.email.AbstractEmailService;
import com.aishu.doc.msg.service.DocAuditMsgNotice;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * @description 接收审核相关的NSQ消息处理类
 * @author lw
 */
@Slf4j
@Component(value = NsqConstants.WORKFLOW_AUDIT_MSG)
public class AuditMsgReceiver extends DocAuditCommonService implements MessageHandler {

    @Autowired
    private DocAuditHistoryService docAuditHistoryService;

    @Autowired
    private AuditMsgReceiver aditMsgReceiver;

    @Autowired
    private DocAuditMsgNotice docAuditMsgNotice;

    // 定义重试的最大次数
    private static final int MAX_RETRIES = 3;

    // 定义重试的间隔时间（毫秒）
    private static final long RETRY_INTERVAL = 1000;

    /**
     * @description 接收审核相关的NSQ消息，做相关审核后置执行处理（如发邮件、发第三方消息等）
     * @author lw
     * @param  handler
     * @updateTime 2021/7/14
     */
    @Override
    public void handler(String msg) {
        if (log.isDebugEnabled()) {
            log.debug("接收审核相关的NSQ消息处理类 正在处理...");
        }
        try {
            ProcessInstanceModel processInstance = JSONUtil.toBean(msg, ProcessInstanceModel.class);
            Object startNoAuditor = (Boolean) processInstance.getProcessInputModel().getFields().get("startNoAuditor");
            if (startNoAuditor != null && (Boolean) startNoAuditor) {
                return;
            }
            new Thread(()->{
                // 发送邮件
                sendEmail(processInstance);
                // 记录日志
                recordOperationLog(processInstance);
                // 发送消息
                docAuditMsgNotice.preSendMessage(processInstance);
            }).start();
        } catch (Exception e) {
            log.warn("接收审核相关的NSQ消息处理失败！obj:", msg, e);
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, "接收审核相关的NSQ消息处理失败", e, msg);
        }finally{
        }
    }

    /**
     * @description 发送邮件
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/20
     */
    private void sendEmail(ProcessInstanceModel processInstance) {
        int retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                String type = processInstance.getProcessInputModel().getFields().get("type").toString();
                boolean isArbitraily = (boolean) processInstance.getProcessInputModel().getFields().get("isArbitraily");
                AbstractEmailService service = ApplicationContextHolder
                        .getBean("email_to_" + (isArbitraily ? "arbitraily" : type), AbstractEmailService.class);
                service.sendEmail(processInstance);
                break;
            } catch (Exception e) {
                log.warn("sendEmail error", e);
                // 如果还未达到最大重试次数，则进行重试
                if (retries < MAX_RETRIES) {
                    retries++;
                    System.out.println("重试次数：" + retries);
                    waitBeforeRetry();
                }
            }
        }
    }

    /**
     * @description 审核记录操作日志
     * @author ouandyang
     * @param  processInstance 流程实例数据
     * @updateTime 2021/8/28
     */
    private void recordOperationLog(ProcessInstanceModel processInstance) {
        String procStatus = processInstance.getProcState()==null? "" : processInstance.getProcState();
        if (String.valueOf(AuditStatusEnum.UNDONE.getValue()).equals(procStatus)){
            return;
        }
        int retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService
                        .getByProcInstId(processInstance.getProcInstId());
                Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
                String ip = null;
                String userId = null;
                if (fields.get("ip") != null) {
                    ip = fields.get("ip").toString();
                }
                if (fields.get("userId") != null) {
                    userId = fields.get("userId").toString();
                }
                DocAuditApplyModel docAuditApplyModel = new DocAuditApplyModel();
                BeanUtil.copyProperties(docAuditHistoryModel, docAuditApplyModel);
                String auditIdea = (String) processInstance.getProcessInputModel().getFields().get("auditIdea");
                docAuditApplyModel.setAuditIdea("true".equals(auditIdea));
                Object attachments = processInstance.getProcessInputModel().getFields().get("attachments");
                docAuditApplyModel.setAttachments(attachments==null? null: (List<String>) attachments);
                Object sendBackSwitch = fields.get("sendBack");
                if (processInstance.isFinish() || processInstance.isAutoReject()) {
                    if(StrUtil.isNotEmpty(userId)){
                        aditMsgReceiver.addAuditLog(docAuditApplyModel, ip, userId);
                    }
                    if (sendBackSwitch != null && (Boolean) sendBackSwitch) {
                        aditMsgReceiver.addSendBackLog(docAuditHistoryModel, ip, userId);
                    } else {
                        aditMsgReceiver.addAuditedLog(docAuditHistoryModel, ip, userId);
                    }
                } else if (processInstance.getCurrentActivity() == null) {
                    if (sendBackSwitch != null && (Boolean) sendBackSwitch) {
                        aditMsgReceiver.addReSubmitLog(docAuditApplyModel);
                    } else {
                        aditMsgReceiver.addApplyLog(docAuditApplyModel);
                    }
                } else if (StrUtil.isNotBlank(auditIdea)){
                    aditMsgReceiver.addAuditLog(docAuditApplyModel, ip, userId);
                }
                break;
            } catch (Exception e) {
                log.warn("recordOperationLog error", e);
                // 如果还未达到最大重试次数，则进行重试
                if (retries < MAX_RETRIES) {
                    retries++;
                    System.out.println("重试次数：" + retries);
                    waitBeforeRetry();
                }
            }
        }

    }

    // 重试间隔等待
    private static void waitBeforeRetry() {
        try {
            TimeUnit.MILLISECONDS.sleep(RETRY_INTERVAL);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
