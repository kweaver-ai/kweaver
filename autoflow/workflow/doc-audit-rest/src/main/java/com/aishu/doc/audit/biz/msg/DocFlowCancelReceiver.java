package com.aishu.doc.audit.biz.msg;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.service.InBoxService;
import com.aishu.wf.core.doc.service.MessageHandleExecutor;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 取消文档流转申请
 * @author ouandyang
 */
@Slf4j
@Component(value = NsqConstants.CORE_AUDIT_FLOW_RECEIVER)
public class DocFlowCancelReceiver implements MessageHandler, MessageHandleExecutor {

    /**
     * 流程作废原因,文件变更
     */
    private static final String FLOW_DEL_FILE_CANCEL= "flow_del_file_cancel";
    /**
     * 操作用户-管理员（固定id）
     */
    private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

    @Resource
    private DocAuditApplyService docAuditApplyService;
    @Resource
    private ProcessInstanceService processInstanceService;
    @Resource
    private DocAuditSubmitService docAuditSubmitService;
    @Autowired
    private InBoxService inBoxService;

    /**
     * @description 接收文档流转申请，作废流程
     * @author ouandyang
     * @param  message
     * @updateTime 2021/5/13
     */
    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("文档流转取消申请事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
			return;
		}

        inBoxService.addInBoxMessage(NsqConstants.CORE_AUDIT_FLOW_RECEIVER, msg);
    }

    @Override
    public void handleMessage(String msg) {
        try {
            log.info("nsq===接收到文档流转取消申请消息：{}", msg);
            JSONArray applyIds = JSONUtil.parseObj(msg).getJSONArray("apply_ids");
            String[] ids = (String[]) applyIds.toArray(String.class);
            if(ids.length == 0){
                return;
            }
            List<DocAuditApplyModel> list = docAuditApplyService.list(new LambdaQueryWrapper<DocAuditApplyModel>()
                .in(DocAuditApplyModel::getBizId, ids));
            if (CollUtil.isEmpty(list)) {
                return;
            }
            List<String> procInstIds = list.stream().map(DocAuditApplyModel::getProcInstId).distinct()
                    .collect(Collectors.toList());
            //流程作废，更新业务数据
            docAuditSubmitService.batchCancel(procInstIds, USER_ADMIN, FLOW_DEL_FILE_CANCEL);
        } catch (JSONException e) {
            log.warn("nsq===处理文档流转取消申请消息异常, json解析失败！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===处理文档流转取消申请消息异常, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_AUDIT_FLOW_RECEIVER, e, msg);
            log.warn("nsq===处理文档流转取消申请消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
		}
    }

}