package com.aishu.doc.audit.biz.msg;

import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;

import com.aishu.doc.audit.common.DocAuditMainService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.vo.DocRealnameShareApply;
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

/**
 * @description 共享给指定用户的申请
 * @author ouandyang
 */
@Slf4j
@Component(value = NsqConstants.CORE_AUDIT_SHARE_REALNAME_APPLY)
public class DocRealnameShareReceiver implements MessageHandler, MessageHandleExecutor {

    @Resource
    private DocAuditMainService auditService;
    @Autowired
    private InBoxService inBoxService;

    /**
     * @description 发起共享给指定用户的申请
     * @author ouandyang
     * @param  handler
     * @updateTime 2021/5/13
     */
    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("文件共享申请事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
			return;
		}

        inBoxService.addInBoxMessage(NsqConstants.CORE_AUDIT_SHARE_REALNAME_APPLY, msg); 
    }

    @Override
    public void handleMessage(String msg) {
        try {
            log.info("nsq===接收到共享给指定用户的申请审核消息：{}", msg);
            DocRealnameShareApply nsqMessage = JSONUtil.toBean(msg, DocRealnameShareApply.class);
            ValidatorUtils.validateEntity(nsqMessage);
            DocAuditApplyModel docAuditApplyModel = nsqMessage.builderDocAuditApplyModel();
            auditService.startDocAudit(docAuditApplyModel);
        } catch (JSONException e) {
            log.warn("发起共享给指定用户的申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
        } catch (WorkFlowException e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_INFO, e.getMessage(), e, msg);
            log.warn("发起共享给指定用户的申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
            throw e;
        } catch (ValidateException e) {
            // 校验失败时直接丢弃消息
            SysLogUtils.insertSysLog(SysLogBean.TYPE_INFO, e.getMessage(), e, msg);
            log.warn("发起共享给指定用户的申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
        } catch (NullPointerException e) {
            log.warn("nsq===处理共享给指定用户的申请审核消息异常, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (IllegalArgumentException e) {
            log.warn("nsq===处理共享给指定用户的申请审核消息异常, 申请已存在！{message：{}}", new String(msg), e);
        }  catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, e.getMessage(), e, msg);
            log.warn("nsq===处理共享给指定用户的申请审核消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
		}
    }
}