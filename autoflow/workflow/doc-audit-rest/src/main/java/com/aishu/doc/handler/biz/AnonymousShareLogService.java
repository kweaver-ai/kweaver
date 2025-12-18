package com.aishu.doc.handler.biz;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.EmailAndLogCommonService;
import com.aishu.doc.common.DocUtils;
import com.aishu.doc.common.TaskTypeEnum;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author ouandyang
 * @description 匿名共享审核日志
 */
@Service(value = DocConstants.DOC_AUDIT_LOG_PRFIX + DocConstants.BIZ_TYPE_ANONYMITY_SHARE)
public class AnonymousShareLogService implements DocAuditLogService {

    @Autowired
    UserService userService;

    @Autowired
    EmailAndLogCommonService commonService;

    private final static String APPLY_MSG_TEMPLATE = "“{}”发起”共享给任意用户的申请”";
    private final static String APPLY_EX_MSG_TEMPLATE = "文档路径：“{}”；共享者：“{}”；SharedLink地址：“{}”；链接标题：“{}”；权限：“{}”；访问密码：“{}”；有效期：“{}”；打开次数限制：“{}”";
    private final static String AUDIT_MSG_TEMPLATE = "审核员“{}”对“{}”发起的”共享给任意用户的申请”进行审核";
    private final static String AUDIT_EX_MSG_TEMPLATE = "文档路径：“{}”；共享者：“{}”；SharedLink地址：“{}”；链接标题：“{}”；权限：“{}”；访问密码：“{}”；有效期：“{}”；打开次数限制：“{}”；审核结果：“{}”";
    private final static String AUDITED_MSG_TEMPLATE = "“{}”发起的”共享给任意用户的申请”审核完成";
    private final static String AUDITED_EX_MSG_TEMPLATE = "文档路径：“{}”；共享者：“{}”；SharedLink地址：“{}”；链接标题：“{}”；权限：“{}”；访问密码：“{}”；有效期：“{}”；打开次数限制：“{}”；审核结果：“{}”";
    private final static String UNDONE_MSG_TEMPLATE = "“{}”发起的”共享给任意用户的申请”已撤销";
    private final static String UNDONE_EX_MSG_TEMPLATE = "文档路径：“{}”；共享者：“{}”；链接标题：“{}”；权限：“{}”；访问密码：“{}”；有效期：“{}”；打开次数限制：“{}”";
    private final static String COUNTERSIGN_MSG_TEMPLATE = "审核员“{}”后加签”{}”成功";
    private final static String Folder_EX_MSG_TEMPLATE = "文档唯一标识：{}；文件夹密级：{}";
    private final static String File_EX_MSG_TEMPLATE = "文档唯一标识：{}；文件密级：{}";
    private final static String TRANSFER_MSG_TEMPLATE= "审核员“{}”转交“{}”给“{}”成功";
    private final static String TRANSFER_EX_MSG_TEMPLATE = "文档路径：“{}”；共享者：“{}”；SharedLink地址：“{}”；链接标题：“{}”；权限：“{}”；访问密码：“{}”；有效期：“{}”；打开次数限制：“{}”";

    @Override
    public String buildApplyLogMsg(DocAuditApplyModel docAuditApplyModel) {
        return StrUtil.format(APPLY_MSG_TEMPLATE, docAuditApplyModel.getApplyUserName());
    }

    @Override
    public String buildApplyLogExMsg(DocAuditApplyModel docAuditApplyModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditApplyModel.getApplyDetail());
        String expiresAt = "-1".equals(detail.getStr("expiresAt")) ? "永久有效" : detail.getStr("expiresAt");
        String url = "https://xxx/link/" + detail.getStr("linkId");
        String accessLimit = "-1".equals(detail.getStr("accessLimit")) ? "无限制" : detail.getStr("accessLimit");
        String exMsg = StrUtil.format(APPLY_EX_MSG_TEMPLATE, docAuditApplyModel.getDocPath(),
                docAuditApplyModel.getApplyUserName(), url, detail.getStr("title"),
                this.getPremStr(detail), detail.getStr("password"), expiresAt, accessLimit);
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docAuditApplyModel.getDocId(),
                docAuditApplyModel.getDocType(), docAuditApplyModel.getCsfLevel());
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
        String expiresAt = "-1".equals(detail.getStr("expiresAt")) ? "永久有效" : detail.getStr("expiresAt");
        String result = docAuditApplyModel.getAuditIdea() ? "通过" : "未通过";
        String url = "https://xxx/link/" + detail.getStr("linkId");
        String accessLimit = "-1".equals(detail.getStr("accessLimit")) ? "无限制" : detail.getStr("accessLimit");
        String exMsg =  StrUtil.format(AUDIT_EX_MSG_TEMPLATE, docAuditApplyModel.getDocPath(),
                docAuditApplyModel.getApplyUserName(), url, detail.getStr("title"),
                this.getPremStr(detail), detail.getStr("password"), expiresAt, accessLimit, result);
        return commonService.setAttachmentLog(docAuditApplyModel.getAttachments(),
                buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docAuditApplyModel.getDocId(),
                docAuditApplyModel.getDocType(), docAuditApplyModel.getCsfLevel()));
    }

    @Override
    public String buildAuditedLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(AUDITED_MSG_TEMPLATE, docAuditHistoryModel.getApplyUserName());
    }

    @Override
    public String buildAuditedLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());

        String expiresAt = "-1".equals(detail.getStr("expiresAt")) ? "永久有效" : detail.getStr("expiresAt");
        String result = "";
        if (AuditStatusEnum.AVOID.getValue() == docAuditHistoryModel.getAuditStatus()) {
            result = "自动审核";
        } else if (AuditStatusEnum.PASS.getValue() == docAuditHistoryModel.getAuditStatus()) {
            result = "通过";
        } else if (AuditStatusEnum.REJECT.getValue() == docAuditHistoryModel.getAuditStatus()) {
            result = "未通过";
        }
        String url = "https://xxx/link/" + detail.getStr("linkId");
        String accessLimit = "-1".equals(detail.getStr("accessLimit")) ? "无限制" : detail.getStr("accessLimit");
        String exMsg =  StrUtil.format(AUDITED_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(),
                docAuditHistoryModel.getApplyUserName(), url, detail.getStr("title"), this.getPremStr(detail),
                detail.getStr("password"), expiresAt, accessLimit, result);
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docAuditHistoryModel.getDocId(),
                docAuditHistoryModel.getDocType(), docAuditHistoryModel.getCsfLevel());
    }

    @Override
    public String buildUndoneLogMsg(DocAuditHistoryModel docAuditHistoryModel) {
        return StrUtil.format(UNDONE_MSG_TEMPLATE, docAuditHistoryModel.getApplyUserName());
    }

    @Override
    public String buildUndoneLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String expiresAt = "-1".equals(detail.getStr("expiresAt")) ? "永久有效" : detail.getStr("expiresAt");
        String accessLimit = "-1".equals(detail.getStr("accessLimit")) ? "无限制" : detail.getStr("accessLimit");
        String exMsg =  StrUtil.format(UNDONE_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(),
                docAuditHistoryModel.getApplyUserName(), detail.getStr("title"), this.getPremStr(detail),
                detail.getStr("password"), expiresAt, accessLimit);
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docAuditHistoryModel.getDocId(),
                docAuditHistoryModel.getDocType(), docAuditHistoryModel.getCsfLevel());
    }

    @Override
    public String buildCountersignLogMsg(String auditorName, String userName) {
        return StrUtil.format(COUNTERSIGN_MSG_TEMPLATE, userName, auditorName);
    }

    @Override
    public String buildCountersignLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String expiresAt = "-1".equals(detail.getStr("expiresAt")) ? "永久有效" : detail.getStr("expiresAt");
        String url = "https://xxx/link/" + detail.getStr("linkId");
        String accessLimit = "-1".equals(detail.getStr("accessLimit")) ? "无限制" : detail.getStr("accessLimit");
        String exMsg =  StrUtil.format(APPLY_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(),
                docAuditHistoryModel.getApplyUserName(), url, detail.getStr("title"),
                this.getPremStr(detail), detail.getStr("password"), expiresAt, accessLimit);
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docAuditHistoryModel.getDocId(),
                docAuditHistoryModel.getDocType(), docAuditHistoryModel.getCsfLevel());
    }


    @Override
    public String buildTransferLogMsg(String auditorName, String applyType, String assigneeTo) {
        String taskName = TaskTypeEnum.TASKTYPE_ANONYMOUS.get(TaskTypeEnum.getzh_CN());
        return StrUtil.format(TRANSFER_MSG_TEMPLATE, auditorName, taskName, assigneeTo);
    }

    @Override
    public String buildTransferLogExMsg(DocAuditHistoryModel docAuditHistoryModel) {
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        String expiresAt = "-1".equals(detail.getStr("expiresAt")) ? "永久有效" : detail.getStr("expiresAt");
        String url = "https://xxx/link/" + detail.getStr("linkId");
        String accessLimit = "-1".equals(detail.getStr("accessLimit")) ? "无限制" : detail.getStr("accessLimit");
        String exMsg =  StrUtil.format(TRANSFER_EX_MSG_TEMPLATE, docAuditHistoryModel.getDocPath(),
                docAuditHistoryModel.getApplyUserName(), url, detail.getStr("title"),
                this.getPremStr(detail), detail.getStr("password"), expiresAt, accessLimit);
        return buildUniqueIdentifierAndCsfLevelLogMsg(exMsg, docAuditHistoryModel.getDocId(),
                docAuditHistoryModel.getDocType(), docAuditHistoryModel.getCsfLevel());
    }

    /**
     * @description 获取权限
     * @author ouandyang
     * @param detail
     * @updateTime 2021/8/26
     */
    private String getPremStr(JSONObject detail) {
        return DocUtils.convertPermToChinese(detail.getStr("allowValue"));
    }

    /**
     * @description 构建文件或文件夹唯一标识和密级
     * @author siyu.chen
     * @param docAuditApplyModel
     * @updateTime 2023/3/31
     */
    public String buildUniqueIdentifierAndCsfLevelLogMsg(String exMsg, String docGns, String objType,
            Integer csfLevel) {
        String docID = DocUtils.convertDocId(docGns);
        return exMsg.concat("；")
                .concat(objType.equals("folder") ? StrUtil.format(Folder_EX_MSG_TEMPLATE, docID, csfLevel)
                        : StrUtil.format(File_EX_MSG_TEMPLATE, docID, csfLevel));
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
