package com.aishu.doc.audit.vo;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.wf.core.doc.common.DocConstants;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/11/18 11:04
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "任意审核消息实体")
public class ArbitrailyApply {

    @ApiModelProperty(value = "任意审核消息实体process对象")
    private ArbitrailyProcess process;

    @ApiModelProperty(value = "任意审核消息实体data对象json字符串")
    private String data;

    @ApiModelProperty(value = "任意审核消息实体workflow对象")
    private ArbitrailyWorkflow workflow;

    public DocAuditApplyModel builderDocAuditApplyModel() {
        String bizType = this.process.getAudit_type().equals(DocConstants.SHARED_LINK_PERM)
                || this.process.getAudit_type().equals(DocConstants.CHANGE_OWNER) ||
                this.process.getAudit_type().equals(DocConstants.CHANGE_INHERIT) ? DocConstants.BIZ_TYPE_REALNAME_SHARE
                        : this.process.getAudit_type();
        DocAuditApplyModel docAuditApplyModel = DocAuditApplyModel.builder()
                .bizId(this.process.getApply_id())
                .applyUserId(this.process.getUser_id())
                .conflictApplyId(this.process.getConflict_apply_id())
                .bizType(bizType)
                .applyType(this.process.getAudit_type())
                .procDefKey(this.process.getProc_def_key())
                .applyUserName(this.process.getUser_name())
                .csfLevel(this.workflow.getTop_csf())
                .build();
        JSONObject detail = JSONUtil.createObj();
        detail.set("process", this.process);
        detail.set("data", this.data);
        detail.set("workflow", this.workflow);
        if (this.process != null && this.process.getAutomatic_approval() != null) {
            detail.set("autoApproval", this.process.getAutomatic_approval());
        }
        docAuditApplyModel.setApplyDetail(detail.toString());
        // 获取文件名称
        docAuditApplyModel.setDocNames(getDocName());
        return getFileDetails(docAuditApplyModel);
    }

    /**
     * @description 获取文件名称
     * @author hanj
     * @updateTime 2022/11/18
     */
    private String getDocName() {
        return JSONUtil.parseObj(this.getWorkflow().getAbstract_info()).getStr("text");
    }

    /**
     * @description
     * @author hanj
     * @param docAuditApplyModel docAuditApplyModel
     * @updateTime 2022/11/18
     */
    private DocAuditApplyModel getFileDetails(DocAuditApplyModel docAuditApplyModel) {
        try {
            JSONObject dataJSONObject = JSONUtil.parseObj(this.getData());
            if (dataJSONObject.containsKey("docs") && null != dataJSONObject.get("docs")) {
                JSONArray jsonArray = JSON.parseArray(JSON.toJSONString(dataJSONObject.get("docs")));
                if (jsonArray.size() > 0) {
                    docAuditApplyModel.setDocId(JSONUtil.parseObj(jsonArray.get(0)).getStr("id"));
                    docAuditApplyModel.setDocPath(JSONUtil.parseObj(jsonArray.get(0)).getStr("data_path"));
                }
            }
            String abstractInfoJsonStr = this.getWorkflow().getAbstract_info();
            if (StrUtil.isEmpty(abstractInfoJsonStr)) {
                return docAuditApplyModel;
            }
            String docType = JSONUtil.parseObj(abstractInfoJsonStr).getStr("icon");
            docType = (docType.equals(DocConstants.DOC_TYPE_FILE) || docType.equals(DocConstants.DOC_TYPE_FOLDER)
                    || docType.equals(DocConstants.DOC_TYPE_MULTIPLE)) ? docType : null;
            docAuditApplyModel.setDocType(docType);
            return docAuditApplyModel;
        } catch (Exception e) {

        }
        return docAuditApplyModel;
    }

}
