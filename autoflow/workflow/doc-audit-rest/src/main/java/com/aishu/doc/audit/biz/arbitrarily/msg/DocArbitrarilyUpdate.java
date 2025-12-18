package com.aishu.doc.audit.biz.arbitrarily.msg;

import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.vo.ArbitrailyApply;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.service.InBoxService;
import com.aishu.wf.core.doc.service.MessageHandleExecutor;

import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * @description 模块后端更新审核内容
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.WORKFLOW_AUDIT_UPDATE)
public class DocArbitrarilyUpdate implements MessageHandler, MessageHandleExecutor {

    @Resource
    private DocAuditApplyService docAuditApplyService;

    @Autowired
    private InBoxService inBoxService;

    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("任意审核模块后端更新审核内容事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
            return;
        }
        
        inBoxService.addInBoxMessage(NsqConstants.WORKFLOW_AUDIT_UPDATE, msg);
    }
    
    @Override
    public void handleMessage(String msg) {
        try {
            String applyId = JSONUtil.parseObj(msg).getStr("apply_id");
            ArbitrailyApply arbitrailyApply = JSONUtil.toBean(msg, ArbitrailyApply.class);
    
            docAuditApplyService.updateApplyData(applyId, arbitrailyApply);
        } catch (JSONException e) {
            log.warn("nsq===处理任意审核模块后端更新审核内容消息异常, json解析失败！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===处理任意审核模块后端更新审核内容消息异常, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.WORKFLOW_AUDIT_UPDATE, e, msg);
            log.warn("nsq===处理任意审核模块后端更新审核内容消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
        }
    }
}