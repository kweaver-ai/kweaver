package com.aishu.doc.audit.biz.arbitrarily.msg;

import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.alibaba.fastjson.*;
import com.aishu.doc.audit.common.DocAuditMainService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.vo.ArbitrailyApply;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.common.validation.util.ValidatorUtils;
import com.aishu.wf.core.doc.service.InBoxService;
import com.aishu.wf.core.doc.service.MessageHandleExecutor;
import com.aishu.wf.core.engine.util.WorkFlowException;
import aishu.cn.msq.MessageHandler;
import com.aishu.wf.core.common.exception.ValidateException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import javax.management.RuntimeErrorException;

/**
 * @description 发起审核申请
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.WORKFLOW_AUDIT_APPLY)
public class DocArbitrarilyReceiver implements MessageHandler, MessageHandleExecutor {
    @Resource
    private DocAuditMainService auditService;

    @Autowired
    private InBoxService inBoxService;

    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("任意审核发起审核申请事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
            return;
        }

        inBoxService.addInBoxMessage(NsqConstants.WORKFLOW_AUDIT_APPLY, msg);
    }

    @Override
    public void handleMessage(String msg) {
        try {
            ArbitrailyApply nsqMessage = JSONUtil.toBean(msg, ArbitrailyApply.class);
            ValidatorUtils.validateEntity(nsqMessage);
            DocAuditApplyModel docAuditApplyModel = nsqMessage.builderDocAuditApplyModel();
            auditService.startDocAudit(docAuditApplyModel);
        } catch (JSONException e) {
            log.warn("发起任意审核发起审核申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
        } catch (WorkFlowException e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_INFO, NsqConstants.WORKFLOW_AUDIT_APPLY, e, msg);
            log.warn("发起任意审核发起审核申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
            throw e;
        } catch (ValidateException e) {
            // 校验异常直接丢弃消息
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.WORKFLOW_AUDIT_APPLY, e, msg);
            log.warn("nsq===处理任意审核发起审核申请消息异常！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===处理任意审核发起审核申请消息异常, 数据不存在！{message：{}}", new String(msg), e);
        } catch (IllegalArgumentException e) {
            log.warn("nsq===处理任意审核发起审核申请消息异常, 申请已存在！{message：{}}", new String(msg), e);
        }  catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.WORKFLOW_AUDIT_APPLY, e, msg);
            log.warn("nsq===处理任意审核发起审核申请消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
        }
    }
}