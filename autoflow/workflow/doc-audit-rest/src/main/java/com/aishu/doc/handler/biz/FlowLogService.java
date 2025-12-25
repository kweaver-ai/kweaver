package com.aishu.doc.handler.biz;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.EmailAndLogCommonService;
import com.aishu.doc.common.DocUtils;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author ouandyang
 * @description 流转审核日志
 */
@Service(value = DocConstants.DOC_AUDIT_LOG_PRFIX + DocConstants.BIZ_TYPE_FLOW)
public class FlowLogService implements DocAuditLogService {

    @Autowired
    UserService userService;

    @Autowired
    EmailAndLogCommonService commonService;

    private final static String AUDIT_MSG_TEMPLATE = "审核员“{}”对“{}”发起的“文档流转申请“进行审核";
    private final static String AUDIT_EX_MSG_TEMPLATE = "文档名称：{}；流转名称：{}；目标位置：{}；流转说明：{}；审核结果：{}";
    private final static String APPLY_FOR_MSG_TEMPLATE = "“{}”发起”文档流转申请”";
    private final static String APPLY_FOR_EX_MSG_TEMPLATE = "文档名称：{}；流转名称：{}；目标位置：{}；流转说明：{}";
    private final static String AUDITED_MSG_TEMPLATE = "“{}”发起的”文档流转申请”审核完成";
    private final static String AUDITED_EX_MSG_TEMPLATE = "文档名称：{}；流转名称：{}；目标位置：{}；审核结果：{}";
    private final static String UNDONE_MSG_TEMPLATE = "“{}”发起的”文档流转申请”已撤销";
    private final static String UNDONE_EX_MSG_TEMPLATE = "文档名称：{}；流转名称：{}；目标位置：{}；流转说明：{}";
    private final static String COUNTERSIGN_MSG_TEMPLATE = "审核员“{}”后加签”{}”成功";
    private final static String COUNTERSIGN_EX_MSG_TEMPLATE = "文档名称：{}；流转名称：{}；目标位置：{}；流转说明：{}";
    private final static String Folder_EX_MSG_TEMPLATE = "{文件夹名称：{}，文档唯一标识：{}，文件夹密级：{}}";
    private final static String File_EX_MSG_TEMPLATE = "{文件名称：{}，文档唯一标识：{}，文件密级：{}}";
    private final static String Docs_EX_MSG_TEMPLATE = "文档信息：[{}]";
    private final static String TRANSFER_MSG_TEMPLATE= "审核员“{}”转交“{}”给“{}”成功";
    private final static String TRANSFER_EX_MSG_TEMPLATE = "文档名称：{}；流转名称：{}；目标位置：{}；流转说明：{}";
    private final static String SENDBACK_MSG_TEMPLATE= "审核员“{}”退回文档流转/收集申请给“{}”成功";
    private final static String SENDBACK_EX_MSG_TEMPLATE= "退回理由：{}";
    private final static String RESUBMIT_MSG_TEMPLATE= "申请人”{}“重新发起“文档流转/收集申请”成功";
    private final static String RESUBMIT_EX_MSG_TEMPLATE= "文档名称：{}；流转名称：{}；目标位置：{}；流转说明：{}";

    @Override
    public String buildApplyLogMsg(DocAuditApplyModel docAuditApplyModel) {
        return StrUtil.format(APPLY_FOR_MSG_TEMPLATE, docAuditApplyModel.getApplyUserName());
    }

    @Override
    public String buildApplyLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        String exMsg = StrUtil.format(APPLY_FOR_EX_MSG_TEMPLATE, docAuditApplyModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "",detail.get("targetPath"), detail.get("flowExplain"));
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs);
    }

    @Override
    public String buildAuditLogMsg(DocAuditApplyModel docAuditApplyModel, String userId) {
        String userName = "";
        if(null != userId){
            User user = userService.getUserById(userId);
            userName = user.getUserName();
        }
        return StrUtil.format(AUDIT_MSG_TEMPLATE, userName, docAuditApplyModel.getApplyUserName());
    }

    @Override
    public String buildAuditLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        String result = docAuditApplyModel.getAuditIdea() ? "通过" : "未通过";
        String exMsg = StrUtil.format(AUDIT_EX_MSG_TEMPLATE, docAuditApplyModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "", detail.get("targetPath"), detail.get("flowExplain")
                , result);
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return commonService.setAttachmentLog(docAuditApplyModel.getAttachments(),
                buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs));
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

        String exMsg = StrUtil.format(AUDITED_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "",detail.get("targetPath"), result);
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs);
    }

    @Override
    public String buildUndoneLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        return StrUtil.format(UNDONE_MSG_TEMPLATE, docAuditHistoryModel.getApplyUserName());
    }

    @Override
    public String buildUndoneLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String exMsg =  StrUtil.format(UNDONE_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "",detail.get("targetPath"), detail.get("flowExplain"));
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs);
    }

    @Override
    public String buildCountersignLogMsg(String auditorName, String userName) {
        return StrUtil.format(COUNTERSIGN_MSG_TEMPLATE, userName, auditorName);
    }

    @Override
    public String buildCountersignLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String exMsg =  StrUtil.format(COUNTERSIGN_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "",detail.get("targetPath"), detail.get("flowExplain"));
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs);
    }

    @Override
    public String buildTransferLogMsg(String auditorName, String applyType, String assigneeTo) {
        String taskName = TaskTypeEnum.TASKTYPE_FLOW.get(TaskTypeEnum.getzh_CN());
        return StrUtil.format(TRANSFER_MSG_TEMPLATE, auditorName, taskName, assigneeTo);
    }

    @Override
    public String buildTransferLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String exMsg =  StrUtil.format(TRANSFER_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "",detail.get("targetPath"), detail.get("flowExplain"));
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs);
    }

    /**
     * @description 构建文件或文件夹唯一标识和密级
     * @author siyu.chen
     * @param docAuditApplyModel
     * @updateTime 2023/3/31
     */
    public String buildUniqueIdentifierAndCsfLevelLogMsg(String exMsg, JSONArray docs) {
        StringBuffer sub = new StringBuffer();
        for (int i = 0; i < docs.size(); i++) {
            JSONObject object = JSONUtil.parseObj(docs.get(i));
            Object path = object.get("path");
            Object id = object.get("id");
            Object csfLevel = object.get("csf_level");
            String name = DocUtils.convertDocId(path.toString());
            String docID = DocUtils.convertDocId(id.toString());
            String res = object.get("type").equals("folder")
                    ? StrUtil.format(Folder_EX_MSG_TEMPLATE, name, docID, csfLevel)
                    : StrUtil.format(File_EX_MSG_TEMPLATE, name, docID, csfLevel);
            sub.append(i != docs.size() - 1 ? res.concat("，") : res);
        }
        return StrUtil.format(exMsg.concat(";").concat(Docs_EX_MSG_TEMPLATE), sub.toString());
    }

    @Override
    public String buildSendBackLogMsg(DocAuditHistoryModel docAuditHistoryModel, String userId) {
        String userName = "";
        if(null != userId){
            User user = userService.getUserById(userId);
            userName = user.getUserName();
        }
        return StrUtil.format(SENDBACK_MSG_TEMPLATE, userName, docAuditHistoryModel.getApplyUserName());
    }

    @Override
    public String buildSendBackExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(SENDBACK_EX_MSG_TEMPLATE, docAuditHistoryModel.getAuditMsg());
    }

    @Override
    public String buildResubmitLogMsg(DocAuditApplyModel docAuditApplyModel) {
        return StrUtil.format(RESUBMIT_MSG_TEMPLATE, docAuditApplyModel.getApplyUserName());
    }

    @Override
    public String buildResubmitExMsg(DocAuditApplyModel docAuditApplyModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        String exMsg = StrUtil.format(RESUBMIT_EX_MSG_TEMPLATE, docAuditApplyModel.getDocPath(), detail.containsKey("flowName") ? detail.get("flowName") : "",detail.get("targetPath"), detail.get("flowExplain"));
        JSONArray docs = JSONUtil.parseArray(detail.get("docs"));
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docs);
    }
}
