package com.aishu.doc.audit.biz.arbitrarily.msg;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
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
 * @description 模块后端主动撤销审核
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.WORKFLOW_AUDIT_CANCEL)
public class DocArbitrarilyCancel implements MessageHandler, MessageHandleExecutor {

    /**
     * 操作用户-管理员（固定id）
     */
    private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

    @Autowired
    protected AnyShareConfig anyShareConfig;
    @Resource
    private DocAuditSubmitService docAuditSubmitService;
    @Autowired
    private InBoxService inBoxService;

    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("任意审核模块后端主动撤销审核事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
            return;
        }
        
        inBoxService.addInBoxMessage(NsqConstants.WORKFLOW_AUDIT_CANCEL, msg);
    }

    private String getArbitrarilyRevocationCause(JSONObject causeJsonObject){
        try {
            if(anyShareConfig.getLanguage().equals("en_US")){
                return causeJsonObject.getStr("en-us");
            }else if(anyShareConfig.getLanguage().equals("zh_CN")){
                return causeJsonObject.getStr("zh-cn");
            }else{
                return causeJsonObject.getStr("zh-tw");
            }
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public void handleMessage(String msg) {
        try {
            JSONArray applyIdArray = JSONUtil.parseObj(msg).getJSONArray("apply_ids");
            JSONObject causeJsonObject = JSONUtil.parseObj(msg).getJSONObject("cause");
            String[] applyIds = (String[]) applyIdArray.toArray(String.class);
            for (String applyId : applyIds) {
                docAuditSubmitService.arbitrarilyBatchRevocation(applyId, null, getArbitrarilyRevocationCause(causeJsonObject));
            }
        } catch (JSONException e) {
            log.warn("nsq===处理任意审核模块后端主动撤销审核消息异常, json解析失败！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===处理任意审核模块后端主动撤销审核消息异常, 数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.WORKFLOW_AUDIT_CANCEL, e, msg);
            log.warn("nsq===处理任意审核模块后端主动撤销审核消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
            
        }
    }
}
