package com.aishu.doc.email;

import cn.hutool.core.codec.Base64;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.DocUtils;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.doc.email.common.EmailUtils;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.google.common.collect.Maps;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @author ouandyang
 * @description 匿名申请邮件内容
 */
@Service(value = "email_to_" + DocConstants.BIZ_TYPE_ANONYMITY_SHARE)
public class AnonymousEmailService extends AbstractEmailService {
    /**
     * 邮件模板文件夹
     */
    private final static String EMAIL_TEMPLAT_PATH = "share";

    @Autowired
    DictService dictService;

    @Override
    protected Map<String, Object> bulidAuditorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        data.put("docPath", fields.get("docName"));
        data.put("docPathSub", EmailUtils.substring(fields.get("docName").toString(), 130));
        data.put("applyUserName", fields.get("applyUserName"));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidCreatorEmailFields(ProcessInstanceModel processInstance) {
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = initCommFileds(fields);
        String anyshareAddress = getASUrl();
        data.put("auditIdea", fields.get("auditIdea"));
        data.put("auditMsg", fields.get("auditMsg"));
        data.put("sharedLink", anyshareAddress + "/link/" + fields.get("linkId"));
        data.put("passWord", StrUtil.isEmpty(fields.get("passWord").toString()) ? "- -": fields.get("passWord"));
        data.put("asUrl",  anyshareAddress+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=apply&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidRevocationEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getById(processInstance.getBusinessKey());
        Map<String, Object> data = Maps.newHashMap();
        data.put("type", model.getApplyType());
        data.put("applyUserName", model.getApplyUserName());
        // 文档名称
        String docName = model.getDocPath().substring(model.getDocPath().lastIndexOf("/") + 1, model.getDocPath().length());
        data.put("docName", docName);
        data.put("docNameSub", EmailUtils.substring(docName, 60));
        return data;
    }

    @Override
    protected Map<String, Object> bulidRevocationToCreatorEmailFields(ProcessInstanceModel processInstance) {
        // 只有文档同步才有对创建人发送撤销邮件的需求（删除流程时，给发起人发送撤销邮件）
        return null;
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
    protected Map<String, Object> bulidTransferEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        JSONObject applyDetailObj = JSONUtil.parseObj(model.getApplyDetail());
        data.put("docName", model.getDocNames());
        data.put("linkName", applyDetailObj.get("title"));
        data.put("authority", DocUtils.convertPermToChinese(applyDetailObj.getStr("allowValue")));
        data.put("expairedAt", applyDetailObj.getStr("expiresAt").equals("-1")? getExpired() : applyDetailObj.getStr("expiresAt").equals("-1"));
        data.put("extCode", applyDetailObj.getStr("password"));
        data.put("openCount", applyDetailObj.getStr("accessLimit"));
        data.put("bizType", model.getBizType());
        data.put("applyUserName",model.getApplyUserName());
        data.put("mailHeadImg", auditConfig.builderMailHeadSvg());
        data.put("applyTypeName", TaskTypeEnum.getTaskTypeName(model.getBizType(), language, isSecret()));
        data.put("asUrl",  getASUrl()+"/doc-audit-client/#/?emailUrl=" + Base64.encode(getASEmailUrl()+"?target=todo&applyId=" + fields.get("id")));
        return data;
    }

    @Override
    protected Map<String, Object> bulidReminderEmailFields(ProcessInstanceModel processInstance) {
        DocAuditHistoryModel model = docAuditHistoryService.getByProcInstId(processInstance.getProcInstId());
        Map<String, Object> fields = processInstance.getProcessInputModel().getFields();
        Map<String, Object> data = Maps.newHashMap();
        String path = model.getDocPath();
        JSONObject applyDetailObj = JSONUtil.parseObj(model.getApplyDetail());
        if (StrUtil.isBlank(path) && applyDetailObj.containsKey("data")) {
            JSONObject dataObj = JSONUtil.parseObj(applyDetailObj.get("data"));
            JSONObject docObj = JSONUtil.parseObj(dataObj.get("doc"));
            path = docObj.getStr("path");
        }
        data.put("remark", fields.get("remark"));
        data.put("docPath", StrUtil.isBlank(path)? "" : path);
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
        return null;
    }
}
