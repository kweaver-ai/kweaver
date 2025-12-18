package com.aishu.doc.handler.biz;

import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.EmailAndLogCommonService;
import com.aishu.doc.common.CommonUtils;
import com.aishu.doc.common.DocSyncAuditTypeEnum;
import com.aishu.doc.common.DocUtils;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author ouandyang
 * @description 同步审核日志
 */
@Service(value = DocConstants.DOC_AUDIT_LOG_PRFIX + DocConstants.BIZ_TYPE_SYNC)
public class SyncLogService implements DocAuditLogService {

    @Autowired
    UserService userService;
    @Autowired
    EmailAndLogCommonService commonService;

    private final static String AUDIT_MSG_TEMPLATE = "审核员“{}”对“{}”发起的“文档域同步申请”进行审核";
    private final static String AUDIT_EX_MSG_TEMPLATE = "文档名称：“{}”；同步位置：“{}”；同步模式：“{}”；审核结果：“{}”";
    private final static String AUDITED_MSG_TEMPLATE = "“{}”发起的“文档域同步申请”审核完成";
    private final static String AUDITED_EX_MSG_TEMPLATE = "文档名称：“{}”；同步位置：“{}”；同步模式：“{}”；审核结果：“{}”";
    private final static String UNDONE_MSG_TEMPLATE = "“{}”发起的“文档域同步申请”已撤销";
    private final static String UNDONE_EX_MSG_TEMPLATE = "文档名称：“{}”；同步位置：“{}”；同步模式：“{}”；审核结果：“{}”";
    private final static String COUNTERSIGN_MSG_TEMPLATE = "审核员“{}”后加签”{}”成功";
    private final static String COUNTERSIGN_EX_MSG_TEMPLATE = "文档名称：“{}”；同步位置：“{}”；同步模式：“{}”";
    private final static String File_EX_MSG_TEMPLATE = "{文件名称：{}，文档唯一标识：{}，文件版本：{}，文件路径：{}，文件大小：{}}";
    private final static String Docs_EX_MSG_TEMPLATE = "文档信息：[{}]";
    private final static String TRANSFER_MSG_TEMPLATE= "审核员“{}”转交“{}”给“{}”成功";
    private final static String TRANSFER_EX_MSG_TEMPLATE = "文档名称：“{}”；同步位置：“{}”；同步模式：“{}”";

    @Override
    public String buildApplyLogMsg(DocAuditApplyModel docAuditApplyModel) {
        throw new RestException("This type does not record operation logs");
    }

    @Override
    public String buildApplyLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        throw new RestException("This type does not record operation logs");
    }

    @Override
    public String buildAuditLogMsg(DocAuditApplyModel docAuditApplyModel, String userId) {
        String userName = "";
        if (null != userId) {
            User user = userService.getUserById(userId);
            userName = user.getUserName();
        }
        return StrUtil.format(AUDIT_MSG_TEMPLATE, userName, docAuditApplyModel.getDocPath());
    }

    @Override
    public String buildAuditLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        String result = docAuditApplyModel.getAuditIdea() ? "通过" : "未通过";
        String applyTime = DateUtil.format(docAuditApplyModel.getApplyTime(), DatePattern.NORM_DATETIME_MINUTE_FORMAT);
        String exMsg = StrUtil.format(AUDIT_EX_MSG_TEMPLATE, docAuditApplyModel.getDocPath(), detail.get("targetPath"),
                DocSyncAuditTypeEnum.getNameByCode(detail.getStr("mode")), result);
        exMsg = commonService.setAttachmentLog(docAuditApplyModel.getAttachments(), exMsg);
        return buildDocsInfoLogMsg(exMsg, detail.get("data"));
    }

    @Override
    public String buildAuditedLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(AUDITED_MSG_TEMPLATE, docAuditHistoryModel.getApplyUserName());
    }

    @Override
    public String buildAuditedLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String result = "";
        if (AuditStatusEnum.AVOID.getValue() == docAuditHistoryModel.getAuditStatus()) {
            result = "自动审核";
        } else if (AuditStatusEnum.PASS.getValue() == docAuditHistoryModel.getAuditStatus()) {
            result = "通过";
        } else if (AuditStatusEnum.REJECT.getValue() == docAuditHistoryModel.getAuditStatus()) {
            result = "未通过";
        }
        String applyTime = DateUtil.format(docAuditHistoryModel.getApplyTime(), DatePattern.NORM_DATETIME_MINUTE_FORMAT);
        String exMsg = StrUtil.format(AUDITED_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.get("targetPath"),
                DocSyncAuditTypeEnum.getNameByCode(detail.getStr("mode")), result);
        return buildDocsInfoLogMsg(exMsg, detail.get("data"));
    }

    @Override
    public String buildUndoneLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(UNDONE_MSG_TEMPLATE, docAuditHistoryModel.getApplyUserName());
    }

    @Override
    public String buildUndoneLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String exMsg = StrUtil.format(UNDONE_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.get("targetPath"),
                DocSyncAuditTypeEnum.getNameByCode(detail.getStr("mode")));
        return buildDocsInfoLogMsg(exMsg, detail.get("data"));
    }

    @Override
    public String buildCountersignLogMsg(String auditorName, String userName) {
        return StrUtil.format(COUNTERSIGN_MSG_TEMPLATE, userName, auditorName);
    }

    @Override
    public String buildCountersignLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String exMsg = StrUtil.format(COUNTERSIGN_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.get("targetPath"),
                DocSyncAuditTypeEnum.getNameByCode(detail.getStr("mode")));
        return buildDocsInfoLogMsg(exMsg, detail.get("data"));
    }
    @Override
    public String buildTransferLogMsg(String auditorName, String applyType, String assigneeTo) {
        String taskName = TaskTypeEnum.TASKTYPE_SYNC.get(TaskTypeEnum.getzh_CN());
        return StrUtil.format(TRANSFER_MSG_TEMPLATE, auditorName, taskName, assigneeTo);
    }

    @Override
    public String buildTransferLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String exMsg = StrUtil.format(TRANSFER_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.get("targetPath"),
                DocSyncAuditTypeEnum.getNameByCode(detail.getStr("mode")));
        return buildDocsInfoLogMsg(exMsg, detail.get("data"));
    }

    /**
     * @description 构建文件日志详细信息
     * @author siyu.chen
     * @param obj obj
     * @updateTime 2023/3/31
     */
    public String buildDocsInfoLogMsg(String exMsg, Object dataObj) {
        JSONObject data = JSONUtil.parseObj(dataObj);
        JSONArray docs = JSONUtil.parseArray(data.get("docs"));
        StringBuffer sub = new StringBuffer();
        for (int i = 0; i < docs.size(); i++) {
            JSONObject object = JSONUtil.parseObj(docs.get(i));
            Object name = object.get("data_name");
            Object id = object.get("id");
            Object rev = object.get("data_rev");
            Object path = object.get("data_path");
            String size = CommonUtils.formatFileSize(object.get("size").toString(),true);
            String docID = DocUtils.convertDocId(id.toString());
            String res = StrUtil.format(File_EX_MSG_TEMPLATE, name, docID, rev, path, size);
            sub.append(i != docs.size() - 1 ? res.concat("，") : res);
        }
        return StrUtil.format(exMsg.concat(";").concat(Docs_EX_MSG_TEMPLATE), sub.toString());
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
