package com.aishu.doc.audit.biz.msg;

import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.common.DocAuditMainService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.doc.audit.service.DocumentService;
import com.aishu.doc.audit.vo.DocSyncApply;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.thrift.service.DocumentThriftService;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.common.validation.util.ValidatorUtils;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.service.InBoxService;
import com.aishu.wf.core.doc.service.MessageHandleExecutor;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.alibaba.fastjson.JSONObject;
import com.aishu.wf.core.common.exception.ValidateException;
import aishu.cn.msq.MessageHandler;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * @description 文档同步申请
 * @author ouandyang
 */
@Slf4j
@Component(value = NsqConstants.CORE_AUDIT_SYNC_APPLY)
public class DocSyncReceiver implements MessageHandler, MessageHandleExecutor {

    @Resource
    private DocAuditMainService auditService;
    @Resource
    private DocumentThriftService docService;
    @Resource
    private DocumentService documentService;
    @Autowired
    private InBoxService inBoxService;

    /**
     * @description 发起文档同步申请
     * @author ouandyang
     * @param  handler
     * @updateTime 2021/5/13
     */
    @Override
    public void handler(String msg) {
        if (log.isDebugEnabled()) {
            log.debug("文档同步申请事件监听处理类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
			return;
		}
        
        inBoxService.addInBoxMessage(NsqConstants.CORE_AUDIT_SYNC_APPLY, msg); 
    }

    @Override
    public void handleMessage(String msg) {
        try {
            log.info("nsq===接收到文档同步共享审核消息：{}", msg);
            DocSyncApply nsqMessage = JSONUtil.toBean(msg, DocSyncApply.class);
            ValidatorUtils.validateEntity(nsqMessage);
            DocAuditApplyModel docAuditApplyModel = nsqMessage.builderDocAuditApplyModel();
            // 查询文档信息
            JSONObject docInfo = documentService.getDocInfo(docAuditApplyModel.getDocId());
            docAuditApplyModel.setDocPath(DocConstants.DOC_PATH_PREFIX + docInfo.get("path").toString());
            docAuditApplyModel.setDocType(docInfo.get("type").toString());
            // 获取文档密级
            Integer csfLevel = docService.getDocCsfLevelByDocId(DocConstants.DOC_TYPE_FOLDER.equals(docAuditApplyModel.getDocType()),
                    docAuditApplyModel.getDocId());
            // 获取文档库类型
            String docLibType = documentService.getDocLibType(docAuditApplyModel.getDocId());
            JSONObject detail = JSONObject.parseObject(docAuditApplyModel.getApplyDetail());
            detail.put("docLibType", docLibType);
            List<DocAuditDetailModel> docAuditDetailModelList = new ArrayList<DocAuditDetailModel>();

            docAuditDetailModelList.add(DocAuditDetailModel.builder()
                    .docId(docInfo.get("id").toString())
                    .docPath(docInfo.get("path").toString())
                    .docType(docInfo.get("type").toString())
                    .csfLevel(csfLevel)
                    .build());
            docAuditApplyModel.setDocNames(DocUtils.getDocNameByPath(docInfo.get("path").toString()));

            docAuditApplyModel.setDocAuditDetailModels(docAuditDetailModelList);
            docAuditApplyModel.setApplyDetail(detail.toJSONString());
            docAuditApplyModel.setCsfLevel(csfLevel);
            auditService.startDocAudit(docAuditApplyModel);
        } catch (JSONException e) {
            log.warn("发起文档同步申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
        } catch (WorkFlowException e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_INFO, e.getMessage(), e, msg);
            log.warn("发起文档同步申请=={error:{}, msg:{}}", e.getMessage(), new String(msg));
            throw e;
        } catch (ValidateException e) {
            // 校验失败时直接丢弃消息
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, e.getMessage(), e, msg);
            log.warn("nsq===处理文档同步审核消息异常！{message：{}}", new String(msg), e);
        } catch (NullPointerException e) {
            log.warn("nsq===处理文档同步审核消息异常, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (IllegalArgumentException e) {
            log.warn("nsq===处理文档同步审核消息异常, 申请已存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, e.getMessage(), e, msg);
            log.warn("nsq===处理文档同步审核消息异常！{message：{}}", new String(msg), e);
            throw e;
        }finally {
		}
    }
}
