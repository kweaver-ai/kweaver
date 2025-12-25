package com.aishu.doc.email;

import cn.hutool.core.codec.Base64;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.DocUtils;
import com.aishu.doc.email.common.EmailSubjectEnum;
import com.aishu.doc.email.common.EmailUtils;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.google.common.collect.Maps;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @description 同步申请邮件内容
 * @author ouandyang
 */
@Service(value = "email_to_" + DocConstants.BIZ_TYPE_SYNC)
public class SyncEmailService extends AbstractEmailService {
    /**
     * 邮件模板文件夹
     */
    private final static String EMAIL_TEMPLAT_PATH = "sync";


    @Override
    protected Map<String, Object> bulidAuditorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("applyUserName", fields.get("applyUserName"));
        data.put("docPath", fields.get("docName"));
        data.put("docPathSub", EmailUtils.substring(fields.get("docName").toString(), 130));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidCreatorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("auditIdea", fields.get("auditIdea"));
        data.put("auditMsg", fields.get("auditMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=apply&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidRevocationEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getById(processInstance.getBusinessKey());
        Map<String, Object> data = Maps.newHashMap();
        data.put("applyUserName", model.getApplyUserName());
        // 文档名称
        String docName = DocUtils.getDocNameByPath(model.getDocPath());
        data.put("docName", docName);
        data.put("docNameSub", EmailUtils.substring(docName, 60));
        return data;
    }

    @Override
    protected Map<String, Object> bulidRevocationToCreatorEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getById(processInstance.getBusinessKey());
        Map<String, Object> data = Maps.newHashMap();
        // 文档名称
        String docName = DocUtils.getDocNameByPath(model.getDocPath());
        data.put("docName", docName);
        data.put("docNameSub", EmailUtils.substring(docName, 60));
        return data;
    }

    @Override
    protected Map<String, Object> bulidCancelEmailFields(ProcessInstanceModel processInstance) {
        // 只有文档流转才有对创建人发送失效邮件的需求
        return null;
    }

    @Override
    protected String getTemplatePath() {
        return EMAIL_TEMPLAT_PATH;
    }

    @Override
    protected String getAuditorEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SYNC_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SYNC_AUDITOR.getEnUS();
        } else {
            return EmailSubjectEnum.SYNC_AUDITOR.getZhCN();
        }
    }

    @Override
    protected String getCreatorEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SYNC_CREATOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SYNC_CREATOR.getEnUS();
        } else {
            return EmailSubjectEnum.SYNC_CREATOR.getZhCN();
        }
    }

    @Override
    protected String getRevocationAuditorEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SYNC_REVOCATION_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SYNC_REVOCATION_AUDITOR.getEnUS();
        } else {
            return EmailSubjectEnum.SYNC_REVOCATION_AUDITOR.getZhCN();
        }
    }



    @Override
    protected Map<String, Object> bulidTransferEmailFields(ProcessInstanceModel processInstance) {
        // 文档域同步已接入任意审核可不处理
        throw new UnsupportedOperationException("Unimplemented method 'bulidTransferEmailFields'");
    }

    @Override
    protected Map<String, Object> bulidReminderEmailFields(ProcessInstanceModel processInstance) {
        // 文档域同步已接入任意审核可不处理
        throw new UnsupportedOperationException("Unimplemented method 'bulidReminderEmailFields'");
    }

    @Override
    protected Map<String, Object> bulidSendBackEmailFields(ProcessInstanceModel processInstance) {
        return null;
    }
}
