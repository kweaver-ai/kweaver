package com.aishu.doc.audit.biz.msg;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.service.InBoxService;
import com.aishu.wf.core.doc.service.MessageHandleExecutor;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * @description 审核信息变更
 * @author xiashenghui
 */
@Slf4j
@Component(value = NsqConstants.CORE_AUDIT_FLOW_MODIFY)
public class DocFlowRealname implements MessageHandler, MessageHandleExecutor {


    /**
     * 操作用户-管理员（固定id）
     */
    private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

    @Resource
    private DocAuditApplyService docAuditApplyService;
    @Resource
    private DocAuditHistoryService docAuditHistoryService;
    @Autowired
    private InBoxService inBoxService;

    /**
     * @description 变更流程名称
     * @author xiashenghui
     * @param  handler
     * @updateTime 2021/5/13
     */
    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("变更流程名称监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
			return;
		}
     
        inBoxService.addInBoxMessage(NsqConstants.CORE_AUDIT_FLOW_MODIFY, msg); 
    }


    @Override
    public void handleMessage(String msg) {
        try {
            log.info("nsq===接收到变更流程名称申请消息：{}", msg);
            JSONArray applyIds = JSONUtil.parseObj(msg).getJSONArray("apply_ids");
            Object flowNmae = JSONUtil.parseObj(msg).get("flow_name");
            String[] ids = (String[]) applyIds.toArray(String.class);
            if(ids.length == 0){
                return;
            }
            List<DocAuditApplyModel> ayylyList = docAuditApplyService.list(new LambdaQueryWrapper<DocAuditApplyModel>()
                .in(DocAuditApplyModel::getBizId, ids));
            JSONObject detail = new JSONObject();
            for (DocAuditApplyModel applyModel:ayylyList) {
                detail = JSONUtil.parseObj(applyModel.getApplyDetail());
                detail.set("flowName",flowNmae);
                applyModel.setApplyDetail(detail.toString());
                docAuditApplyService.saveOrUpdate(applyModel);
            }
            List<DocAuditHistoryModel> historyList = docAuditHistoryService.list(new LambdaQueryWrapper<DocAuditHistoryModel>()
                    .in(DocAuditHistoryModel::getBizId, ids));
            for (DocAuditHistoryModel historyModel:historyList) {
                detail = JSONUtil.parseObj(historyModel.getApplyDetail());
                detail.set("flowName",flowNmae);
                historyModel.setApplyDetail(detail.toString());
                docAuditHistoryService.saveOrUpdate(historyModel);
            }
        } catch (JSONException e) {
            log.warn("nsq===处理变更流程名称申请消息异常, json解析失败！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===处理变更流程名称申请消息异常, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_AUDIT_FLOW_MODIFY, e, msg);
            log.warn("nsq===处理变更流程名称申请消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
		}
    }


}
