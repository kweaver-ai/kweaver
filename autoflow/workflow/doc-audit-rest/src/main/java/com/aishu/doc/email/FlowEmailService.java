package com.aishu.doc.email;

import cn.hutool.core.codec.Base64;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.doc.email.common.EmailSubjectEnum;
import com.aishu.doc.email.common.EmailUtils;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.google.common.collect.Maps;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @description 文档流转邮件内容
 * @author ouandyang
 */
@Service(value = "email_to_" + DocConstants.BIZ_TYPE_FLOW)
public class FlowEmailService extends AbstractEmailService {
    /**
     * 邮件模板文件夹
     */
    private final static String EMAIL_TEMPLAT_PATH = "flow";

    @Autowired
    DictService dictService;

    //给审核员发送邮件
    @Override
    protected Map<String, Object> bulidAuditorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("applyUserName", fields.get("applyUserName"));
        data.put("flowStrategyCreator", fields.get("flowStrategyCreator"));
        data.put("targetPath", fields.get("targetPath"));
        data.put("sourceDocument", EmailUtils.substring(fields.get("sourceDocument").toString(), 130));
        data.put("flowName", fields.get("flowName"));
        data.put("counterSignMsg", fields.get("counterSignMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        return data;
    }

    //给申请人发送邮件
    @Override
    protected Map<String, Object> bulidCreatorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("applyUserName", fields.get("applyUserName"));
        data.put("flowStrategyCreator", fields.get("flowStrategyCreator"));
        data.put("targetPath", fields.get("targetPath"));
        data.put("auditIdea", fields.get("auditIdea"));
        data.put("sourceDocument", EmailUtils.substring(fields.get("sourceDocument").toString(), 130));
        data.put("flowName", fields.get("flowName"));
        data.put("auditMsg", fields.get("auditMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=apply&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidRevocationEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getById(processInstance.getBusinessKey());
        Map<String, Object> data = Maps.newHashMap();
        JSONObject applyDetail = JSONUtil.parseObj(model.getApplyDetail());
        data.put("applyUserName",model.getApplyUserName());
        data.put("targetPath",JSONUtil.parseObj(model.getApplyDetail()).get("targetPath"));
        data.put("flowStrategyCreator", applyDetail.get("flowStrategyCreator"));
        data.put("flowName", applyDetail.get("flowName"));
        data.put("sourceDocument", EmailUtils.substring(getsourceDocument(
                applyDetail.containsKey("docList") ? applyDetail.getStr("docList") : applyDetail.getStr("docs")), 130));
        return data;
    }
    //获取源文件名称
    private String getsourceDocument(String docList) {
        if (docList == null){
            return "";
        }
        JSONArray objects = JSON.parseArray(docList);
        StringBuffer str = new StringBuffer();
        String path="";
        for (int i =0 ;i<  objects.size();i++){
            path=JSONUtil.parseObj(objects.get(i)).get("path").toString();
            str.append(path.substring(path.lastIndexOf("/")+1));
            if(i<objects.size()-1){
                str.append("、");
            }
        }
        return str.toString();
    }

    @Override
    protected Map<String, Object> bulidRevocationToCreatorEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getById(processInstance.getBusinessKey());
        Map<String, Object> data = Maps.newHashMap();
        JSONObject applyDetail = JSONUtil.parseObj(model.getApplyDetail());
        data.put("applyUserName",model.getApplyUserName());
        data.put("targetPath",JSONUtil.parseObj(model.getApplyDetail()).get("targetPath"));
        data.put("flowStrategyCreator", applyDetail.get("flowStrategyCreator"));
        data.put("flowName", applyDetail.get("flowName"));
        data.put("sourceDocument", EmailUtils.substring(getsourceDocument(
                applyDetail.containsKey("docList") ? applyDetail.getStr("docList") : applyDetail.getStr("docs")), 130));
        return data;
    }

    @Override
    protected Map<String, Object> bulidCancelEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getById(processInstance.getBusinessKey());
        Map<String, Object> data = Maps.newHashMap();
        JSONObject applyDetail = JSONUtil.parseObj(model.getApplyDetail());
        data.put("applyUserName",model.getApplyUserName());
        data.put("targetPath",JSONUtil.parseObj(model.getApplyDetail()).get("targetPath"));
        data.put("flowStrategyCreator", applyDetail.get("flowStrategyCreator"));
        data.put("flowName", applyDetail.get("flowName"));
        data.put("sourceDocument", EmailUtils.substring(getsourceDocument(
                applyDetail.containsKey("docList") ? applyDetail.getStr("docList") : applyDetail.getStr("docs")), 130));
        return data;
    }

    @Override
    protected String getTemplatePath() {
        return EMAIL_TEMPLAT_PATH;
    }

    @Override
    protected String getAuditorEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_AUDITOR.getEnUS();
        } else {
            return EmailSubjectEnum.FLOW_AUDITOR.getZhCN();
        }
    }

    @Override
    protected String getCreatorEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_CREATOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_CREATOR.getEnUS();
        } else {
            return EmailSubjectEnum.FLOW_CREATOR.getZhCN();
        }
    }

    @Override
    protected String getRevocationAuditorEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_REVOCATION_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_REVOCATION_AUDITOR.getEnUS();
        } else {
            return EmailSubjectEnum.FLOW_REVOCATION_AUDITOR.getZhCN();
        }
    }

    @Override
    protected String getCancelEmailSubject(ProcessInstanceModel processInstance){
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_CANCEL.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.FLOW_CANCEL.getEnUS();
        } else {
            return EmailSubjectEnum.FLOW_CANCEL.getZhCN();
        }
    }

    @Override
    protected Map<String, Object> bulidTransferEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        JSONObject applyDetailObj = JSONUtil.parseObj(model.getApplyDetail());
        data.put("flowName", applyDetailObj.get("flowName"));
        data.put("creatorName", applyDetailObj.get("flowStrategyCreator"));
        data.put("applyCreatorName", model.getApplyUserName());
        data.put("docName", EmailUtils.substring(getsourceDocument(applyDetailObj.containsKey("docList")
                ? applyDetailObj.getStr("docList")
                : applyDetailObj.getStr("docs")), 130));
        data.put("docPath", applyDetailObj.get("targetPath"));
        data.put("bizType", model.getBizType());
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("applyTypeName", TaskTypeEnum.getTaskTypeName(model.getBizType(), language, isSecret()));
        data.put("transferMsg", fields.get("transferMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidReminderEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        JSONObject applyDetailObj = JSONUtil.parseObj(model.getApplyDetail());
        data.put("remark", fields.get("remark"));
        data.put("flowName", applyDetailObj.get("flowName"));
        data.put("creatorName", applyDetailObj.get("flowStrategyCreator"));
        data.put("applyCreatorName", model.getApplyUserName());
        data.put("docName", EmailUtils.substring(getsourceDocument(applyDetailObj.containsKey("docList")
                ? applyDetailObj.getStr("docList")
                : applyDetailObj.getStr("docs")), 130));
        data.put("docPath", applyDetailObj.get("targetPath"));
        data.put("applyUserName",model.getApplyUserName());
        data.put("applyTypeName", TaskTypeEnum.getTaskTypeName(model.getBizType(), language, isSecret()));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        return data;
    }

    /**
     * @description 获取涉密模式状态
     * @author siyu.chen
     * @updateTime 2023/11/22
     */
    private boolean isSecret() {
        Dict secretDict = dictService.findDictByCode(SecretDTO.DICT_SECRET_SWITCH);
        return null != secretDict && "y".equals(secretDict.getDictName()) ? true : false;
    }

    @Override
    protected Map<String, Object> bulidSendBackEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        data.put("auditMsg", fields.get("auditMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=apply&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected String getSenBackEmailSubject(ProcessInstanceModel processInstance) {
        // 获取文档共享标题，其他流程重写该方法
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return String.format(EmailSubjectEnum.SENDBACK_SUBJECT.getZhTW(), "文件流轉/收集申請");
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return String.format(EmailSubjectEnum.SENDBACK_SUBJECT.getZhTW(), "Doc Relay/Collector");
        } else {
            return String.format(EmailSubjectEnum.SENDBACK_SUBJECT.getZhTW(), "文档流转/收集申请");
        }
    }
}
