package com.aishu.doc.email;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.common.EmailAndLogCommonService;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.doc.email.common.EmailSubjectEnum;
import com.aishu.doc.email.common.EmailUtils;
import com.aishu.doc.monitor.AuditMsgReceiver;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.AppstoreClient;
import com.aishu.wf.core.anyshare.client.DeployServiceApi;
import com.aishu.wf.core.anyshare.client.EfastApi;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.thrift.service.SharemgntThriftService;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.EmailSwitchDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.model.dto.PermConfigDTO;
import com.aishu.wf.core.engine.core.service.WorkFlowClinetService;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import freemarker.template.Configuration;
import freemarker.template.Template;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.HistoryService;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author ouandyang
 * @description 发送邮件抽象类
 */
@Slf4j
public abstract class AbstractEmailService {

    protected final static String LANG_ZH_TW = "zh_TW";
    protected final static String LANG_EN_US = "en_US";
    protected final static String TEMPLATE_PATH = "/email-templates/";
    protected final static String SINGLE_AUDIT_EMAIL_TEMPLAT = "/single-audit.ftl";
    protected final static String SINGLE_AUDITED_EMAIL_TEMPLAT = "/single-audited.ftl";
    protected final static String REVOCATION_EMAIL_TEMPLAT = "/revocation.ftl";
    protected final static String REVOCATION_CREATOR_EMAIL_TEMPLAT = "/revocation-creator.ftl";
    protected final static String CANCEL_EMAIL_TEMPLAT = "/cancel.ftl";
    protected final static String TRANSFER_EMAIL_TEMPLAT = "/transfer.ftl";
    protected final static String REMINDER_EMAIL_TEMPLAT = "/reminder.ftl";
    protected final static String SENDBACK_EMAIL_TEMPLAT = "/sendback.ftl";

    @Autowired
    WorkFlowClinetService workFlowClinetService;
    @Autowired
    UserManagementService userManagementService;
    @Autowired
    SharemgntThriftService sharemgntThriftService;
    @Autowired
    DocAuditHistoryService docAuditHistoryService;
    @Autowired
    protected AnyShareConfig anyShareConfig;
    @Autowired
    protected HistoryService historyService;
    @Autowired
    private DictService dictService;
    @Autowired
    EmailAndLogCommonService commonService;
    @Autowired
    private DocShareStrategyService docShareStrategyService;

    DeployServiceApi deployServiceApi;

    AppstoreClient appstoreClient;

    Configuration cfg;

    @Autowired
    AuditConfig auditConfig;

    String language;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        deployServiceApi = anyShareClient.getDeployServiceApi();
        appstoreClient = anyShareClient.getAppstoreClient();
        language = anyShareConfig.getLanguage();
        // 设置邮箱模板所在文件夹路径
        cfg = new Configuration(Configuration.getVersion());
        cfg.setClassForTemplateLoading(AuditMsgReceiver.class, TEMPLATE_PATH + anyShareConfig.getLanguage());
    }

    /**
     * @description 发送邮件
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     */
    public void sendEmail(ProcessInstanceModel processInstance) {
        try {
            // 作废暂时不做处理
            if (processInstance.isCancel() || !isSendEmail(processInstance)) {
                return;
            }
            Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
            Object sendBackSwitch = fields.get("sendBack");
            if (processInstance.isFinish() || processInstance.isAutoReject()) {
                if (sendBackSwitch != null && (Boolean) sendBackSwitch) {
                    // 发送退回邮件
                    this.sendSendBackEmail(processInstance);
                } else {
                    // 发送审核完成邮件
                    this.sendCreatorEmail(processInstance);
                }
            } else if (fields.get("isRevocation") != null && (boolean) fields.get("isRevocation")){
                // 发送撤销邮件
                this.sendRevocationEmail(processInstance);
            } else if (fields.get("flowDeleteReason") != null && (boolean) fields.get("flowDeleteReason")){
                // 发送失效邮件
                this.sendCancelEmail(processInstance);
            } else {
                // 发送审核邮件
                this.sendAuditorEmail(processInstance);
            }
        } catch (Exception e) {
            log.warn("接收审核相关的NSQ消息处理类-发送邮件异常！processInstance:", JSONUtil.toJsonStr(processInstance), e);
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, "接收审核相关的NSQ消息处理类-发送邮件异常", e);
        }
    }

    /**
     * @description 发送审核完成邮件
     * @author ouandyang
     * @param  processInstance 流程实例信息
     * @updateTime 2021/11/9
     */
    private void sendCreatorEmail(ProcessInstanceModel processInstance) throws Exception {
        List<String> userIds = Lists.newArrayList(processInstance.getStartUserId());
        List<String> emailList = userManagementService.getEmails(userIds, null);
        //第一个环节是自动通过第二个环节是自动拒绝的话auditIdea会是第一个环节的数据所以判断一下状态是否是自动拒绝
        if(processInstance.getProcState().equals(String.valueOf(SuspensionState.AUTO_REJECT.getStateCode()))){
            processInstance.getProcessInputModel().getFields().put("auditIdea","false");
            processInstance.getProcessInputModel().getFields().put("auditMsg",null);
        }
        if (CollUtil.isNotEmpty(emailList)) {
            Template template = cfg.getTemplate(getTemplatePath() + SINGLE_AUDITED_EMAIL_TEMPLAT);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template,
                    bulidCreatorEmailFields(processInstance));
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getCreatorEmailSubject(processInstance), content, img);
        }
    }

    /**
     * @description 发送撤销邮件
     * @author ouandyang
     * @param  processInstance 流程实例信息
     * @updateTime 2021/11/9
     */
    private void sendRevocationEmail(ProcessInstanceModel processInstance) throws Exception {
        // 给申请人发送撤销邮件
        if (StrUtil.isNotBlank(processInstance.getStartUserId())) {
            List<String> userIds = Lists.newArrayList(processInstance.getStartUserId());
            List<String> emailList = userManagementService.getEmails(userIds, null);
            if (CollUtil.isNotEmpty(emailList)) {
                Template template = cfg.getTemplate(getTemplatePath() + REVOCATION_CREATOR_EMAIL_TEMPLAT);
                String content = FreeMarkerTemplateUtils.processTemplateIntoString(template,
                        bulidRevocationToCreatorEmailFields(processInstance));
                        String img = auditConfig.builderMailHeadPng();
                sharemgntThriftService.sendEmailWithImage(emailList, getRevocationAuditorEmailSubject(processInstance), content, img);
            }
        }
        // 给审核员发送撤销邮件
        List<String> userIds = bulidRevocationAuditor(processInstance);
        List<String> emailList = userManagementService.getEmails(userIds, null);
        if (CollUtil.isNotEmpty(emailList)) {
            Template template = cfg.getTemplate(getTemplatePath() + REVOCATION_EMAIL_TEMPLAT);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template,
                    bulidRevocationEmailFields(processInstance));
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getRevocationAuditorEmailSubject(processInstance), content, img);
        }
    }

    /**
     * @description 给申请人发送失效邮件
     * @author xiashenghui
     * @param  processInstance 流程实例信息
     * @updateTime 2022/06/15
     */
    private void sendCancelEmail(ProcessInstanceModel processInstance) throws Exception {
        // 给申请人发送失效邮件
        if (StrUtil.isNotBlank(processInstance.getStartUserId())) {
            List<String> userIds = Lists.newArrayList(processInstance.getStartUserId());
            List<String> emailList = userManagementService.getEmails(userIds, null);
            if (CollUtil.isNotEmpty(emailList)) {
                Template template = cfg.getTemplate(getTemplatePath() + CANCEL_EMAIL_TEMPLAT);
                String content = FreeMarkerTemplateUtils.processTemplateIntoString(template,
                        bulidCancelEmailFields(processInstance));
                String img = auditConfig.builderMailHeadPng();
                sharemgntThriftService.sendEmailWithImage(emailList, getCancelEmailSubject(processInstance), content, img);
            }
        }
    }

    /**
     * @description 发送审核邮件
     * @author ouandyang
     * @param  processInstance 流程实例信息
     * @updateTime 2021/11/9
     */
    private void sendAuditorEmail(ProcessInstanceModel processInstance) throws Exception {
        List<String> auditorIds = processInstance.getNextActivity()
                .stream().map(ActivityInstanceModel::getReceiverUserId)
                .collect(Collectors.toList());
        List<String> emailList = userManagementService.getEmails(auditorIds, null);
        if (CollUtil.isNotEmpty(emailList)) {
            Template template = cfg.getTemplate(getTemplatePath() + SINGLE_AUDIT_EMAIL_TEMPLAT);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template, 
                    bulidAuditorEmailFields(processInstance));
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getAuditorEmailSubject(processInstance), content, img);
        }
    }

    /**
     * @description 给加签审核员发送审核邮件
     * @param  auditorId 加签的审核员ID
     * @param  processInstance 流程实例信息
     */
    public void sendCountersignAuditorEmail(ProcessInstanceModel processInstance, String auditorId) throws Exception {
        if (!isSendEmail(processInstance)) {
            return;
        }
        List<String> auditorIds = new ArrayList<>();
        auditorIds.add(auditorId);
        List<String> emailList = userManagementService.getEmails(auditorIds, null);
        if (CollUtil.isNotEmpty(emailList)) {
            Template template = cfg.getTemplate(getTemplatePath() + SINGLE_AUDIT_EMAIL_TEMPLAT);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template,
                    bulidAuditorEmailFields(processInstance));
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getAuditorEmailSubject(processInstance), content, img);
        }
    }

    public void sendTransferAuditorEmail(ProcessInstanceModel processInstance, String auditorId) throws Exception {
        if (!isSendEmail(processInstance)) {
            return;
        }
        List<String> auditorIds = new ArrayList<>();
        auditorIds.add(auditorId);
        List<String> emailList = userManagementService.getEmails(auditorIds, null);
        if (CollUtil.isNotEmpty(emailList)) {
            Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
            Template template = cfg.getTemplate(getTemplatePath() + (fields.get("isArbitraily") != null && (Boolean)fields.get("isArbitraily")? SINGLE_AUDIT_EMAIL_TEMPLAT : TRANSFER_EMAIL_TEMPLAT));
            Map<String, Object> data = bulidTransferEmailFields(processInstance);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template, data);
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getTransferEmailSubject(data), content, img);
        }
    }

    public void sendReminderAuditorEmail(ProcessInstanceModel processInstance, List<String> auditorIds) throws Exception {
        if (!isSendEmail(processInstance)) {
            return;
        }
        List<String> emailList = userManagementService.getEmails(auditorIds, null);
        if (CollUtil.isNotEmpty(emailList)) {
            Template template = cfg.getTemplate(getTemplatePath() + REMINDER_EMAIL_TEMPLAT);
            Map<String, Object> data = bulidReminderEmailFields(processInstance);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template, data);
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getReminderEmailSubject(data), content, img);
        }
    }

    /**
     * @description 发送审核退回邮件
     * @author ouandyang
     * @param  processInstance 流程实例信息
     * @updateTime 2021/11/9
     */
    private void sendSendBackEmail(ProcessInstanceModel processInstance) throws Exception {
        List<String> userIds = Lists.newArrayList(processInstance.getStartUserId());
        List<String> emailList = userManagementService.getEmails(userIds, null);
        if (CollUtil.isNotEmpty(emailList)) {
            Template template = cfg.getTemplate(getTemplatePath() + SENDBACK_EMAIL_TEMPLAT);
            String content = FreeMarkerTemplateUtils.processTemplateIntoString(template,
                    bulidSendBackEmailFields(processInstance));
            String img = auditConfig.builderMailHeadPng();
            sharemgntThriftService.sendEmailWithImage(emailList, getSenBackEmailSubject(processInstance), content, img);
        }
    }

    private Boolean isSendEmail(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        String bizType = fields.get("bizType")== null? "" : fields.get("bizType").toString();
        Dict secretDict = dictService.findDictByCode(EmailSwitchDTO.buildDictName(bizType));
        if (secretDict != null && secretDict.getDictName().equals("n")){
            return false;
        }
        return true;
    }
    /*
     *//**
     * @description 获取需要发送邮件的邮箱
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     *//*
    private List<String> getEmailList(ProcessInstanceModel processInstance) throws Exception {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        List<String> userIds = new ArrayList<String>();
        if (processInstance.isFinish()) {
            // 审核完毕给申请人发送邮件
            userIds.add(processInstance.getStartUserId());
        } else if (fields.get("isRevocation") != null && (boolean) fields.get("isRevocation")){
            // 申请人撤销申请给审核员发送邮件
            userIds = bulidRevocationAuditor(processInstance);
        } else {
            List<ActivityInstanceModel> tasks = processInstance.getNextActivity();
            List<String> auditorIds = tasks.stream().map(ActivityInstanceModel::getReceiverUserId)
                    .collect(Collectors.toList());
            return auditorIds;

//            DocAuditHistoryModel docAuditHistoryModel = getConflictApplyData(fields);
//            if (docAuditHistoryModel != null) {
//                // 重复申请获取审核员
//                userIds = getConflictApplyAuditor(processInstance, docAuditHistoryModel);
//            } else if (CollUtil.isNotEmpty(processInstance.getNextActivity()) && WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(processInstance.getNextActivity().get(0).getActDefType())) {
//                // 如果为逐级审核，给下一审核员发送邮件
//                userIds.add(processInstance.getNextActivity().get(0).getReceiver());
//            } else {
//                // processInstance.getNextActivity().get(0).getReceiver()
//                    String auditors = workFlowClinetService.getAuditors(processInstance, null, null);
//                    List<ProcessAuditor> auditorList = JSONUtil.toList(JSONUtil.parseArray(auditors), ProcessAuditor.class);
//                    userIds = auditorList.stream().map(item -> item.getId()).collect(Collectors.toList());
//
//            }
        }
        return userManagementService.getEmails(userIds, null);
    }

    *//**
     * @description 获取重复申请数据
     * @author ouandyang
     * @param  fields
     * @updateTime 2021/8/27
     *//*
    private DocAuditHistoryModel getConflictApplyData(Map<String, Object> fields) {
        String conflictApplyId = fields.get("conflictApplyId") == null
                ? null : fields.get("conflictApplyId").toString();
        if (StrUtil.isNotBlank(conflictApplyId)) {
            DocAuditHistoryModel model = docAuditHistoryService.getById(conflictApplyId);
            if (model != null && model.getDocId().equals(fields.get("docId"))) {
                return model;
            }
        }
        return null;
    }

    *//**
     * @description 重复申请获取收件人-获取已审核、未收到邮件的审核员
     * @author ouandyang
     * @param  processInstance 流程实例数据
     * @param  model 重复申请数据
     * @updateTime 2021/8/27
     *//*
    private List<String> getConflictApplyAuditor(ProcessInstanceModel processInstance, DocAuditHistoryModel model) {
        // 1、申请表保存重复申请ID
        // 2、查询上一流程当前环节的审核员（历史任务表）
        // 3、如果上一流程当前环节审核员为空-逐级模式获取当前环节第一个审核员；同级、汇签获取所有审核员
        // 4、如果上一流程当前环节审核员不为空
            // 4.1、逐级模式获取当前环节第一个审核员；
                // 4.1.1、该审核员在上一流程中当前环节已审核，返回该审核员
                // 4.1.1、该审核员在上一流程中当前环节未审核，返回空
                // 4.1.1、该审核员在上一流程中当前环节不存在，返回该审核员
            // 4.2、同级、汇签获取已审核的审核员
        List<ProcessAuditor> list = JSONUtil.toList(JSONUtil.parseArray(model.getAuditor()),
                ProcessAuditor.class);
        List<String> userIds = list.stream().filter(item -> WorkflowConstants.AUDIT_RESULT_PASS.equals(item.getStatus()))
                .map(item -> item.getId()).collect(Collectors.toList());
        if (CollUtil.isNotEmpty(processInstance.getNextActivity()) && WorkflowConstants.AUDIT_MODEL.HQSH.getValue().equals(processInstance.getNextActivity().get(0).getActDefType())) {
            return userIds;
        } else if (CollUtil.isNotEmpty(processInstance.getNextActivity()) && WorkflowConstants.AUDIT_MODEL.ZJSH.getValue().equals(processInstance.getNextActivity().get(0).getActDefType())) {
            if (CollUtil.isNotEmpty(userIds)) {
                userIds = Lists.newArrayList(userIds.get(0));
            }
        }
        return null;
    }*/

    /**
     * @description 构建撤销申请审核员-获取收到过审核邮件的审核员
     * @author ouandyang
     * @param  processInstance 流程实例数据
     * @updateTime 2021/8/27
     */
    private List<String> bulidRevocationAuditor(ProcessInstanceModel processInstance) {
        List<HistoricTaskInstance> historicTaskInstances = historyService
                .createHistoricTaskInstanceQuery()
                .processInstanceId(processInstance.getProcInstId()).list();
        return historicTaskInstances.stream().map(item -> item.getAssignee()).collect(Collectors.toList());
    }

    /**
     * @description 初始化公共模板数据
     * @author ouandyang
     * @param  fields
     * @updateTime 2021/7/19
     */
    protected Map<String, Object> initCommFileds(Map<String, Object> fields) {
        Map<String, Object> data = Maps.newHashMap();
        String docName = "";
        String docNameSub = "";
        if(fields.containsKey("docName") && !StrUtil.isEmptyIfStr(fields.get("docName"))){
            // 文档名称
            docName = fields.get("docName").toString();
            docName = docName.substring(docName.lastIndexOf("/") + 1, docName.length());
            docNameSub = EmailUtils.substring(docName, 60);
        }
        data.put("type", fields.get("type"));
        data.put("docName", docName);
        data.put("docNameSub", docNameSub);
        data.put("transferMsg", fields.get("transferMsg"));
        data.put("counterSignMsg", fields.get("counterSignMsg"));
        setAttachmentNames(fields.get("allAttachments"), data, (String)fields.getOrDefault("procDefId", ""), (String)fields.getOrDefault("auditIdea", "false"));
        return data;
    }

    /**
     * @description 获取审核员邮件标题
     * @author ouandyang
     * @updateTime 2021/7/19
     */
    protected String getAuditorEmailSubject(ProcessInstanceModel processInstance){
        // 获取文档共享标题，其他流程重写该方法
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SHARE_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SHARE_AUDITOR.getEnUS();
        } else {
            return EmailSubjectEnum.SHARE_AUDITOR.getZhCN();
        }
    }

    /**
     * @description 获取审核员邮件标题
     * @author ouandyang
     * @updateTime 2021/7/19
     */
    protected String getTransferEmailSubject( Map<String, Object> data){
        if (data.containsKey("automationSubject")) {
            return data.get("automationSubject").toString();
        }
        // 获取文档共享标题，其他流程重写该方法
        String titleOem = auditConfig.builderMailConfig("title_oem").toString();
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return String.format(EmailSubjectEnum.TRANSFER.getZhTW(), titleOem, data.get("applyUserName"), data.get("applyTypeName"));
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return String.format(EmailSubjectEnum.TRANSFER.getEnUS(), titleOem, data.get("applyUserName"), data.get("applyTypeName"));
        } else {
            return String.format(EmailSubjectEnum.TRANSFER.getZhCN(), titleOem, data.get("applyUserName"), data.get("applyTypeName"));
        }
    }

    /**
     * @description 获取审核员邮件标题
     * @author ouandyang
     * @updateTime 2021/7/19
     */
    protected String getReminderEmailSubject( Map<String, Object> data){
        if (data.containsKey("automationSubject")) {
            return data.get("automationSubject").toString();
        }
        // 获取文档共享标题，其他流程重写该方法
        String titleOem = auditConfig.builderMailConfig("title_oem").toString();
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return String.format(EmailSubjectEnum.REMINDER.getZhTW(), titleOem, data.get("applyUserName"), data.get("applyTypeName"));
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return String.format(EmailSubjectEnum.REMINDER.getEnUS(), titleOem, data.get("applyUserName"), data.get("applyTypeName"));
        } else {
            return String.format(EmailSubjectEnum.REMINDER.getZhCN(), titleOem, data.get("applyUserName"), data.get("applyTypeName"));
        }
    }

    /**
     * @description 获取发起人邮件标题
     * @author ouandyang
     * @updateTime 2021/7/19
     */
    protected String getCreatorEmailSubject(ProcessInstanceModel processInstance){
        // 获取文档共享标题，其他流程重写该方法
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SHARE_CREATOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SHARE_CREATOR.getEnUS();
        } else {
            return EmailSubjectEnum.SHARE_CREATOR.getZhCN();
        }
    }

    protected String getSenBackEmailSubject(ProcessInstanceModel processInstance){
        // 重写方法
        return "";
    }

    /**
     * @description 获取撤销申请发送给审核员邮件标题
     * @author ouandyang
     * @updateTime 2021/7/19
     */
    protected String getRevocationAuditorEmailSubject(ProcessInstanceModel processInstance){
        // 获取文档共享标题，其他流程重写该方法
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SHARE_REVOCATION_AUDITOR.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.SHARE_REVOCATION_AUDITOR.getEnUS();
        } else {
            return EmailSubjectEnum.SHARE_REVOCATION_AUDITOR.getZhCN();
        }
    }


    /**
     * @description 获取失效申请发送给审核员邮件标题
     * @author xiashenghui
     * @updateTime 2022/6/16
     */
    protected String getCancelEmailSubject(ProcessInstanceModel processInstance){
        return null;
    }

    /**
     * @description 获取客户端地址
     * @author ouandyang
     * @updateTime 2021/7/22
     */
    protected String getASUrl() {
        try {
            JSONObject json = deployServiceApi.getAccessAddr();
            String host = json.get("host").toString();
            String port = json.get("port").toString();
            String path = "";
            if (json.containsKey("path")){
                path = json.get("path").toString();
            }
            return StrUtil.isNotBlank(path) && !path.equals("/")? String.format("https://%s:%s%s", host, port, path) : String.format("https://%s:%s", host, port);
        } catch (Exception e) {
            log.warn("发送邮件获取客户端地址异常", e);
            return "";
        }
    }

    /**
     * @description 获取客户端发送邮件地址
     * @author ouandyang
     * @updateTime 2021/7/22
     */
    protected String getASEmailUrl() {
        try {
            JSONObject json = deployServiceApi.getAccessAddr();
            String host = json.get("host").toString();
            String port = json.get("port").toString();
            String path = "";
            if (json.containsKey("path")){
                path = json.get("path").toString();
            }
            //获取审核插件functionid和homepage
            return StrUtil.isNotBlank(path) && !path.equals("/")? String.format("https://%s:%s%s/anyshare/%s/%s", host, port, path, getLanguage(), getAppstoreUrl())
                :String.format("https://%s:%s/anyshare/%s/%s", host, port, getLanguage(), getAppstoreUrl());
        } catch (Exception e) {
            log.warn("发送邮件获取客户端地址异常", e);
            return "";
        }
    }

    public String getLanguage (){
        if(anyShareConfig.getLanguage().equals("en_US")){
            return "en-us";
        }else if(anyShareConfig.getLanguage().equals("zh_CN")){
            return "zh-cn";
        }else{
            return "zh-tw";
        }
    }

    protected String getExpired(){
        // 获取文档共享标题，其他流程重写该方法
        if (LANG_ZH_TW.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.NEVER_EXPIRE.getZhTW();
        } else if (LANG_EN_US.equals(anyShareConfig.getLanguage())) {
            return EmailSubjectEnum.NEVER_EXPIRE.getEnUS();
        } else {
            return EmailSubjectEnum.NEVER_EXPIRE.getZhCN();
        }
    }

    /**
     * @description 获取functionid和homepage
     * @author xiashenghui
     * @updateTime 2022/7/05
     */
    protected String  getAppstoreUrl() {
        try {
            JSONObject json = appstoreClient.getApplist();
            JSONArray objects = JSON.parseArray(json.getString("apps"));
            for(int i =0; i <objects.size();i++){
                JSONObject obj = JSONObject.parseObject(objects.get(i).toString());
                if("docAuditClient".equals(obj.get("command"))){
                    return  String.format("applist/microwidgets/%s%s", obj.get("functionid"), obj.get("homepage"));
                }
            }
        } catch (Exception e) {
            log.warn("发送邮件获取functionid异常", e);
        }
        return "";
    }

    protected void setAttachmentNames(Object docIdObj, Map<String, Object> data, String procDefID, String auditResult) {
        if (docIdObj == null) {
            return;
        }
        DocShareStrategy docShareStrategy = docShareStrategyService.getDocShareStrategy(procDefID);
        PermConfigDTO permConfig = JSON.parseObject(docShareStrategy.getPermConfig(), PermConfigDTO.class);
        if (permConfig == null) {
            permConfig = new PermConfigDTO();
            permConfig.setStatus("1");
            permConfig.setPerm_switch(true);
        }
        if (permConfig.getPerm_switch() && permConfig.getStatus().equals("1") && auditResult.equals("true") ||
                permConfig.getPerm_switch() && (permConfig.getStatus().equals("2"))) {
            commonService.addAdditionalProperties(data, (List<String>) docIdObj, true);
        }
    }

    /**
     * @description 构建审核员模板参数
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     */
    protected abstract Map<String, Object> bulidAuditorEmailFields(ProcessInstanceModel processInstance);

    /**
     * @description 构建发起人模板参数
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     */
    protected abstract Map<String, Object> bulidCreatorEmailFields(ProcessInstanceModel processInstance);

    /**
     * @description 构建撤销模板模板参数
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     */
    protected abstract Map<String, Object> bulidRevocationToCreatorEmailFields(ProcessInstanceModel processInstance);

    /**
     * @description 构建失效模板模板参数
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     */
    protected abstract Map<String, Object> bulidCancelEmailFields(ProcessInstanceModel processInstance);


    /**
     * @description 构建撤销模板模板参数
     * @author ouandyang
     * @param  processInstance 流程实例对象
     * @updateTime 2021/7/19
     */
    protected abstract Map<String, Object> bulidRevocationEmailFields(ProcessInstanceModel processInstance);

    /**
     * @description 获取邮件模板所在目录
     * @author ouandyang
     * @updateTime 2021/7/19
     */
    protected abstract String getTemplatePath();

    protected abstract Map<String, Object> bulidTransferEmailFields(ProcessInstanceModel processInstance);

    protected abstract Map<String, Object> bulidReminderEmailFields(ProcessInstanceModel processInstance);

    protected abstract Map<String, Object> bulidSendBackEmailFields(ProcessInstanceModel processInstance);

}
