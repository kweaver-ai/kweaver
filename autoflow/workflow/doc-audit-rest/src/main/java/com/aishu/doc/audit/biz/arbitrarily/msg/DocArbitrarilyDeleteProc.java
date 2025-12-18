package com.aishu.doc.audit.biz.arbitrarily.msg;

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
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 模块后端主动删除审核流程
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.WORKFLOW_AUDIT_DELETE)
public class DocArbitrarilyDeleteProc implements MessageHandler, MessageHandleExecutor {

    /**
     * 模块后端主动删除审核流程
     */
    private static final String ARBITRARILY_DELETE= "arbitrarily_delete";
    /**
     * 操作用户-管理员（固定id）
     */
    private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

    @Resource
    private DocAuditApplyService docAuditApplyService;
    @Resource
    private DocAuditSubmitService docAuditSubmitService;
    @Resource
    private ProcessConfigService processConfigService;
    @Autowired
    private InBoxService inBoxService;

    @Override
    public void handler(java.lang.String msg) {
        if (log.isDebugEnabled()) {
            log.debug("模块后端主动删除审核流程事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
            return;
        }

        inBoxService.addInBoxMessage(NsqConstants.WORKFLOW_AUDIT_DELETE, msg);
    }

    @Override
    public void handleMessage(String msg) {
        try {
            JSONArray proDefKey = JSONUtil.parseObj(msg).getJSONArray("pro_def_keys");
            String[] proDefKeys = (String[]) proDefKey.toArray(String.class);
            List<ProcessInfoConfig> list = processConfigService.getBatchProcessInfoByKey(Arrays.asList(proDefKeys));
            if (CollUtil.isEmpty(list)) {
                return;
            }
            List<String> processDefIdList = list.stream().map(ProcessInfoConfig::getProcessDefId).distinct()
                    .collect(Collectors.toList());
            //批量删除流程
            processConfigService.deleteBatchProcessInfoConfig(processDefIdList);
            List<DocAuditApplyModel> DocAuditApplyList = docAuditApplyService.list(new LambdaQueryWrapper<DocAuditApplyModel>()
                    .in(DocAuditApplyModel::getProcDefKey, processDefIdList));
            if (CollUtil.isEmpty(DocAuditApplyList)) {
                return;
            }
            List<String> procInstIds = DocAuditApplyList.stream().map(DocAuditApplyModel::getProcInstId).distinct()
                    .collect(Collectors.toList());
            //流程作废，更新业务数据
            docAuditSubmitService.arbitrarilyBatchCancel(procInstIds, USER_ADMIN, ARBITRARILY_DELETE);
        } catch (JSONException e) {
            log.warn("nsq===模块后端主动删除审核流程消息异常, json解析失败！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===模块后端主动删除审核流程消息异常, 数据不存在！{message：{}}", new String(msg), e);
        }  catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.WORKFLOW_AUDIT_DELETE, e, msg);
            log.warn("nsq===模块后端主动删除审核流程消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
        }
    }
}
