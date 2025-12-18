package com.aishu.doc.handler.biz;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.EmailAndLogCommonService;
import com.aishu.doc.common.CommonUtils;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSONArray;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @program: workflow
 * @description: 任意审核日志操作类
 * @author: xiashenghui
 * @create: 2022-09-21 11:35
 **/
@Slf4j
@Service(value = DocConstants.DOC_AUDIT_LOG_PRFIX)
public class ArbitrarilyService extends BaseRest implements DocAuditLogService {
    @Autowired
    protected AnyShareConfig anyShareConfig;

    @Autowired
    UserService userService;

    @Autowired
    private I18nController i18n;

    @Autowired
    protected AuditConfig auditConfig;

    @Autowired
    DictService dictService;

    @Autowired
    EmailAndLogCommonService commonService;

    @Override
    public String buildApplyLogMsg(DocAuditApplyModel docAuditApplyModel) {
        return StrUtil.format("“{}”"+i18n.getMessage("hasStarted")+"“{}”", docAuditApplyModel.getApplyUserName(),
                getAuditType(docAuditApplyModel.getBizType()) + i18n.getMessage("applyText"));
    }

    @Override
    public String buildApplyLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        return getOverhead(docAuditApplyModel.getApplyDetail(),null,docAuditApplyModel.getBizType(), docAuditApplyModel.getAttachments());
    }

    @Override
    public String buildAuditLogMsg(DocAuditApplyModel docAuditApplyModel, String userId) {
        String userName = "";
        if(null != userId){
            User user = userService.getUserById(userId);
            userName = user.getUserName();
        }
        return StrUtil.format(i18n.getMessage("auditMgsTemplate"), userName, docAuditApplyModel.getApplyUserName(),
                getAuditType(docAuditApplyModel.getBizType()) + i18n.getMessage("applyText"));
    }

    @Override
    public String buildAuditLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        return getOverhead(docAuditApplyModel.getApplyDetail(),docAuditApplyModel.getAuditIdea()?AuditStatusEnum.PASS.getValue() : AuditStatusEnum.REJECT.getValue(),docAuditApplyModel.getBizType(),
            docAuditApplyModel.getAttachments());
    }

    @Override
    public String buildAuditedLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(i18n.getMessage("auditedMgsTemplate"), docAuditHistoryModel.getApplyUserName(),
                getAuditType(docAuditHistoryModel.getBizType()) + i18n.getMessage("applyText"));
    }

    @Override
    public String buildAuditedLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return getOverhead(docAuditHistoryModel.getApplyDetail(),docAuditHistoryModel.getAuditStatus(),docAuditHistoryModel.getBizType(), null);
    }

    @Override
    public String buildUndoneLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(i18n.getMessage("undoneMgsTemplate"), docAuditHistoryModel.getApplyUserName(),
                getAuditType(docAuditHistoryModel.getBizType()) + i18n.getMessage("applyText"));
    }

    @Override
    public String buildUndoneLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return getOverhead(docAuditHistoryModel.getApplyDetail(),null,docAuditHistoryModel.getBizType(), null);
    }

    @Override
    public String buildCountersignLogMsg(String auditorName, String userName) {
        return StrUtil.format(i18n.getMessage("countersignMgsTemplate"), userName, auditorName);
    }

    @Override
    public String buildCountersignLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return getOverhead(docAuditHistoryModel.getApplyDetail(),null,docAuditHistoryModel.getBizType(), null);
    }

    @Override
    public String buildTransferLogMsg(String auditorName, String applyType, String assigneeTo) {
        String taskName = this.getAuditType(applyType) + i18n.getMessage("applyText");
        return StrUtil.format(i18n.getMessage("transferMgsTemplate"), auditorName, taskName, assigneeTo);
    }

    @Override
    public String buildTransferLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return getOverhead(docAuditHistoryModel.getApplyDetail(),null,docAuditHistoryModel.getBizType(), null);
    }

    /**
     * @description 拼接描述
     * @author hanj
     * @param applyType  审核类型
     * @updateTime 2021/6/5
     */
    private  String  getAuditType(String applyType){
        String frontPluginJsonStr = auditConfig.builderFrontPlugin(applyType);
        String applyTypeName = applyType;
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
     * @description 拼接附加信息
     * @author hanj
     * @param applyDetail  业务数据
     * @param auditStatus  审核结果
     * @param bizType      业务类型，不同类型文件添加详情不同
     * @updateTime 2021/6/5
     */
    private String getOverhead(String applyDetail, Integer auditStatus, String bizType, List<String> attachments){
        StringBuffer sub = new StringBuffer();
        String result = "";
        // 获取审核结果国际化
        if(null == auditStatus){
            result = "";
        } else if (AuditStatusEnum.AVOID.getValue() == auditStatus) {
            result = i18n.getMessage("automaticApproval");
        } else if (AuditStatusEnum.PASS.getValue() == auditStatus) {
            result = i18n.getMessage("pass");
        } else if (AuditStatusEnum.REJECT.getValue() == auditStatus) {
            result = i18n.getMessage("fail");
        }

        JSONObject detail = JSONUtil.parseObj(applyDetail);
        JSONObject workflowJsonObj = JSONUtil.parseObj(JSONUtil.parseObj(detail).get("workflow"));
        List<String> msgForLogList = JSONArray.parseObject(workflowJsonObj.getStr("msg_for_log"), List.class);
        JSONObject contentJsonObj = JSONUtil.parseObj(workflowJsonObj.get("content"));
        commonService.addAdditionalProperties(msgForLogList, contentJsonObj, commonService.getAttachmentLogMulti(), attachments, false);
        if (msgForLogList != null){
            // 根据日志字段循环拼接附加信息
            msgForLogList.forEach(key ->{
                sub.append(contentJsonObj.getStr(key)).append(";");
            });
        }
        // 拼接审核结果
        if(auditStatus != null){
            sub.append(i18n.getMessage("auditResult")).append(result).append(";");
        }
        // 拼接文件详细信息
        sub.append(buildDocsInfoLogMsg(bizType, detail.get("data")));
        return sub.toString();
    }

    /**
     * @description 拼接文件详情，任意审核：定密、文档域同步
     * @author siyu.chen
     * @param dataObj  业务数据
     * @param bizType  业务类型，不同类型文件添加详情不同
     * @updateTime 2023/5/11
     */
    public String buildDocsInfoLogMsg(String bizType, Object dataObj) {
        JSONObject data = JSONUtil.parseObj(dataObj);
        List<Object> docs = JSONArray.parseObject(data.getStr("docs"), List.class);
        StringBuffer sub = new StringBuffer();
        String comma = i18n.getMessage("comma");
        if (bizType.equals(DocConstants.BIZ_TYPE_SYNC)) {
            for (int i = 0; i < docs.size(); i++) {
                JSONObject object = JSONUtil.parseObj(docs.get(i));
                Object name = object.get("data_name");
                Object id = object.get("id");
                Object rev = object.get("data_rev");
                Object path = object.get("data_path");
                String size = CommonUtils.formatFileSize(object.get("size").toString(),true);
                String docID = DocUtils.convertDocId(id.toString());
                String res = StrUtil.format(i18n.getMessage("syncFileMsgTemplate"), name, docID, rev, path, size);
                sub.append(i != docs.size() - 1 ? res.concat(comma) : res);
            }
            return StrUtil.format(i18n.getMessage("docsInfo"), sub.toString());
        }else{
            return sub.toString();
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

    @Override
    public String buildSendBackLogMsg(DocAuditHistoryModel docAuditHistoryModel, String userId) {
        return null;
    }

    @Override
    public String buildSendBackExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return null;
    }

    @Override
    public String buildResubmitLogMsg(DocAuditApplyModel docAuditApplyModel) {
        return null;
    }

    @Override
    public String buildResubmitExMsg(DocAuditApplyModel docAuditApplyModel) {
        return null;
    }
}
