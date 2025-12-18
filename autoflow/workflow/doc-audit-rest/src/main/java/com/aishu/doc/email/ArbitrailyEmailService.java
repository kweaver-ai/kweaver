package com.aishu.doc.email;

import cn.hutool.core.codec.Base64;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.doc.email.common.EmailSubjectEnum;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.alibaba.fastjson.JSONArray;
import com.google.common.collect.Maps;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * @description 任意审核邮件内容
 * @author hanj
 */
@Service(value = "email_to_arbitraily")
public class ArbitrailyEmailService extends AbstractEmailService {

    @Autowired
    protected AnyShareConfig anyShareConfig;

    @Autowired
    protected AuditConfig auditConfig;

    @Autowired
    DictService  dictService;

    /**
     * 邮件模板文件夹
     */
    private final static String EMAIL_TEMPLAT_PATH = "arbitraily";
    private final static String OPTYPE_CREATOR = "creator";
    private final static String OPTYPE_AUDITOR = "auditor";
    private final static String OPTYPE_REVOCATION = "revocation";

    //给审核员发送邮件
    @Override
    protected Map<String, Object> bulidAuditorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("applyUserName", fields.get("applyUserName"));
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        bulidEmailContentFields(fields, data);
        return data;
    }

    //给申请人发送邮件
    @Override
    protected Map<String, Object> bulidCreatorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("applyUserName", fields.get("applyUserName"));
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        data.put("auditIdea", fields.get("auditIdea"));
        data.put("auditMsg", fields.get("auditMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=apply&applyId=" + fields.get("id")));
        bulidEmailContentFields(fields, data);
        return data;
    }

    @Override
    protected Map<String, Object> bulidRevocationEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> data = Maps.newHashMap();
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        bulidEmailContentModel(model, data);
        return data;
    }
    //获取源文件名称
    private String getsourceDocument(JSONArray objects) {
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
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> data = Maps.newHashMap();
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        bulidEmailContentModel(model, data);
        return data;
    }

    @Override
    protected Map<String, Object> bulidCancelEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> data = Maps.newHashMap();
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        bulidEmailContentModel(model, data);
        return data;
    }

    private void bulidEmailContentFields(Map<String, Object> fields, Map<String, Object> data){
        String bizType = fields.get("bizType")==null? "" : fields.get("bizType").toString();
        JSONObject dataObj = JSONUtil.parseObj(fields.get("data"));
        String applyTypeName = this.setContentApplyTypeName(bizType, dataObj, (String)fields.get("frontPluginJsonStr"));
        JSONObject workflowJsonObj = JSONUtil.parseObj(String.valueOf(fields.get("workflow")));
        List<String> msgForEmailList = JSONArray.parseObject(workflowJsonObj.getStr("msg_for_email"), List.class);
        JSONObject contentJsonObj = JSONUtil.parseObj(workflowJsonObj.get("content"));
        List<String> msgForEmailContentList = new ArrayList<>();
        for(String key : msgForEmailList){
            msgForEmailContentList.add(contentJsonObj.getStr(key));
        }
        data.put("msgForEmailContentList", msgForEmailContentList);
        data.put("applyTypeName", applyTypeName);
    }

    private void bulidEmailContentModel(DocAuditHistoryModel docAuditHistoryModel, Map<String, Object> data){
        JSONObject detailObj = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        JSONObject workflowJsonObj = JSONUtil.parseObj(detailObj.get("workflow"));
        JSONObject dataObj = JSONUtil.parseObj(detailObj.get("data"));
        String applyTypeName = this.setContentApplyTypeName(docAuditHistoryModel.getApplyType(), dataObj, "");

        List<String> msgForEmailList = JSONArray.parseObject(workflowJsonObj.getStr("msg_for_email"), List.class);
        List<String> msgForEmailContentList = new ArrayList<>();
        for(String key : msgForEmailList){
            JSONObject contentJsonObj = JSONUtil.parseObj(workflowJsonObj.get("content"));
            msgForEmailContentList.add(contentJsonObj.getStr(key));
        }
        data.put("msgForEmailContentList", msgForEmailContentList);
        data.put("applyTypeName", applyTypeName);
        data.put("type", docAuditHistoryModel.getApplyType());
    }

    @Override
    protected String getTemplatePath() {
        return EMAIL_TEMPLAT_PATH;
    }

    @Override
    protected Map<String, Object> bulidTransferEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        if (fields.get("bizType") != null && fields.get("bizType").toString().equals("automation")) {
            data.put("automationSubject", this.setAutomationEmailSubject(OPTYPE_AUDITOR));
        }
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        data.put("transferMsg", fields.get("transferMsg"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        bulidEmailContentModel(model, data);
        return data;
    }


    @Override
    protected Map<String, Object> bulidReminderEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        if (fields.get("bizType") != null && fields.get("bizType").toString().equals("automation")) {
            data.put("automationSubject", this.setAutomationEmailSubject(OPTYPE_AUDITOR));
        }
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("titleOem", auditConfig.builderMailConfig("title_oem"));
        data.put("remark", fields.get("remark"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        bulidEmailContentModel(model, data);
        return data;
    }

    @Override
    protected String getAuditorEmailSubject(ProcessInstanceModel processInstance){
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        if (docAuditHistoryModel.getApplyType().equals("automation")){
            return this.setAutomationEmailSubject(OPTYPE_AUDITOR);
        }
        String applyTypeName = this.getAuditType(docAuditHistoryModel.getApplyType(), "");
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return applyTypeName + EmailSubjectEnum.AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return applyTypeName + EmailSubjectEnum.AUDITOR.getEnUS() + applyTypeName;
        } else {
            return applyTypeName + EmailSubjectEnum.AUDITOR.getZhCN();
        }
    }

    @Override
    protected String getCreatorEmailSubject(ProcessInstanceModel processInstance){
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        if (docAuditHistoryModel.getApplyType().equals("automation")){
            return this.setAutomationEmailSubject(OPTYPE_CREATOR);
        }
        String applyTypeName = this.getAuditType(docAuditHistoryModel.getApplyType(), "");
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.CREATOR_PREFIX.getZhTW() + applyTypeName + EmailSubjectEnum.CREATOR_SUFFIX.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.CREATOR_PREFIX.getEnUS() + EmailSubjectEnum.CREATOR_SUFFIX.getEnUS();
        } else {
            return EmailSubjectEnum.CREATOR_PREFIX.getZhCN() + applyTypeName + EmailSubjectEnum.CREATOR_SUFFIX.getZhCN();
        }
    }

    @Override
    protected String getRevocationAuditorEmailSubject(ProcessInstanceModel processInstance){
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        if (docAuditHistoryModel.getApplyType().equals("automation")){
            return this.setAutomationEmailSubject(OPTYPE_REVOCATION);
        }
        String applyTypeName = this.getAuditType(docAuditHistoryModel.getApplyType(), "");
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return applyTypeName + EmailSubjectEnum.REVOCATION_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.REVOCATION_AUDITOR.getEnUS() + applyTypeName;
        } else {
            return applyTypeName + EmailSubjectEnum.REVOCATION_AUDITOR.getZhCN();
        }
    }

    @Override
    protected String getCancelEmailSubject(ProcessInstanceModel processInstance){
        DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        String applyTypeName = this.getAuditType(docAuditHistoryModel.getApplyType(), "");
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return applyTypeName + EmailSubjectEnum.CANCEL.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.CANCEL.getEnUS() + applyTypeName;
        } else {
            return applyTypeName + EmailSubjectEnum.CANCEL.getZhCN();
        }
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

    /**
     * @description 拼接描述
     * @author siyu.chen
     * @param applyType  审核类型
     * @updateTime 2023/11/22
     */
    private  String  getAuditType(String applyType, String frontPluginJsonStr){
        List<String> docShareTypes = Arrays.asList("perm", "owner", "inherit");
        if (docShareTypes.contains(applyType)){
            applyType = DocConstants.BIZ_TYPE_REALNAME_SHARE;
        }
        // 适配旧逻辑
        String applyTypeName = applyType;
        if (StrUtil.isBlank(applyType) && StrUtil.isEmpty(frontPluginJsonStr)){
            return applyTypeName;
        }
        // 如果传入的前端插件不为空则直接使用，如果为空则在插件配置中按applyType查询
        frontPluginJsonStr = StrUtil.isEmpty(frontPluginJsonStr)? auditConfig.builderFrontPlugin(applyType) : frontPluginJsonStr;
        if(StrUtil.isNotEmpty(frontPluginJsonStr)){
            String langugae = anyShareConfig.getLanguage().toLowerCase().replace("_","-");
            JSONObject frontPluginJsonObj = JSONUtil.parseObj(frontPluginJsonStr);
            JSONObject labelObj = JSONUtil.parseObj(JSONUtil.toJsonStr(frontPluginJsonObj.get("label")));
            // 如果label包含applyType 则使用applyType对应的标题
            if (labelObj.containsKey(applyType)) {
                    applyTypeName = DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(applyType) && isSecret()? JSONUtil.parseObj(JSONUtil.toJsonStr(frontPluginJsonObj.get("secret_label"))).getStr(langugae)
                        : JSONUtil.parseObj(labelObj.getStr(applyType)).getStr(langugae);
            } else{
                applyTypeName = labelObj.getStr(langugae);
            }
        }
        return applyTypeName;
    }

    /**
     * @description 兼容性修改，任意审核类型为automation，邮件主题修改为固定格式
     * @author siyu.chen
     * @parameters opType 操作类型 Creator、Auditor、Revocation
     * @updateTime 2024/4/1
     */
    private String setAutomationEmailSubject(String opType) {
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return this.getSubjectEnum(opType).getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return this.getSubjectEnum(opType).getEnUS();
        } else {
            return this.getSubjectEnum(opType).getZhCN();
        }
    }

    private EmailSubjectEnum getSubjectEnum(String opType) {
        if (opType.equals(OPTYPE_CREATOR)) {
            return EmailSubjectEnum.AUTOMATION_CREATOR_SUBJECT;
        } else if (opType.equals(OPTYPE_AUDITOR)) {
            return EmailSubjectEnum.AUTOMATION_AUDITOR_SUBJECT;
        } else {
            return EmailSubjectEnum.AUTOMATION_REVOCATION_SUBJECT;
        }
    }

    /**
     * @description 兼容性修改，任意审核类型为automation，邮件内容修改为固定格式
     * @author siyu.chen
     * @parameters applyType 审核发起时绑定的申请类型
     * @parameters dataObj 审核发起时绑定的data数据
     * @parameters frontPluginJsonStr 前端插件JSON数据
     * @updateTime 2024/4/1
     */
    private String setContentApplyTypeName(String applyType, JSONObject dataObj, String frontPluginJsonStr) {
        // 适配自动化流程申请邮件标题
        if (applyType.equals("automation") && dataObj.containsKey("automation_flow_name")){
            return dataObj.getStr("automation_flow_name");
        }else{
            return this.getAuditType(applyType, frontPluginJsonStr);
        }
    }

    @Override
    protected Map<String, Object> bulidSendBackEmailFields(ProcessInstanceModel processInstance) {
       return null;
    }
}
