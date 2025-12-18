package com.aishu.doc.audit.vo;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.wf.core.doc.common.DocConstants;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.Map;

/**
 * @program: workflow
 * @description:
 * @author: xiashenghui
 * @create: 2022-09-14 16:21
 **/
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="任意审核消息实体")
public class DocApply {

    @NotBlank(message = "apply_id不能为空")
    @ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
    private String apply_id;

    @ApiModelProperty(value = "申请人ID", hidden = true)
    private String user_id;

    @NotBlank(message = "申请人名称不能为空")
    @ApiModelProperty(value = "申请人名称", example = "张三", required = true)
    private String user_name;

    @NotBlank(message = "审核申请类型不能为空")
    @ApiModelProperty(value = "audit_type",example = "sync", required = true)
    private String audit_type;

    @ApiModelProperty(value = "conflict_apply_id", hidden = true)
    private String conflict_apply_id;

    @ApiModelProperty(value = "文件密级", example = "5", required = true)
    private Integer secret_level;


    @NotBlank(message = "proc_def_key不能为空")
    @ApiModelProperty(value = "流程定义key", example = "Process_SHARE764", required = true)
    private String proc_def_key;

    @ApiModelProperty(value = "摘要信息", hidden = true)
    private String message;

    @ApiModelProperty(value = "国际化资源", hidden = true)
    private String locale;

    @ApiModelProperty(value = "前端详情插件信息", hidden = true)
    private String front_plugin_info;



    /**
     * @description 构建任意审核实体对象
     * @author xiashenghui
     * @updateTime 2022/9/15
     */
    public DocAuditApplyModel builderDocAuditApplyModel(){
        String bizType = this.getAudit_type().equals(DocConstants.SHARED_LINK_PERM) || this.getAudit_type().equals(DocConstants.CHANGE_OWNER) ||
                this.getAudit_type().equals(DocConstants.CHANGE_INHERIT) ? DocConstants.BIZ_TYPE_REALNAME_SHARE : this.getAudit_type();
        DocAuditApplyModel docAuditApplyModel = DocAuditApplyModel.builder()
                .bizId(this.getApply_id())
                .applyUserId(this.getUser_id())
                .bizType(bizType)
                .applyType(this.getAudit_type())
                .procDefKey(this.getProc_def_key())
                .applyUserName(this.getUser_name())
                .csfLevel(this.secret_level)
                .build();
        JSONObject detail = JSONUtil.createObj();
        detail.set("message", this.getMessage());
        detail.set("locale", this.getLocale());
        detail.set("front_plugin_info", this.getFront_plugin_info());
        docAuditApplyModel.setApplyDetail(detail.toString());
        //获取文件名称
        docAuditApplyModel.setDocNames(getDocName());
        return getFileDetails(docAuditApplyModel);
    }

    /**
     * @description 获取文件名称
     * @author xiashenghui
     * @updateTime 2022/9/15
     */
    private String getDocName(){
        Map<String, Object> obj = JSON.parseObject(this.getMessage(), HashMap.class);
        Map<String, Object> detailObj = Maps.newHashMap();
        obj.forEach((k, v) -> detailObj.put(StrUtil.toUnderlineCase(k), v));
        JSONArray msg_for_abstract = JSONUtil.parseArray(detailObj.get("msg_for_abstract"));
        // msg_for_abstract.get(0)与爱数已沟通第一个字段默认为文件名称字段
        return JSONUtil.parseObj(JSONUtil.parseObj(detailObj.get("content")).get(msg_for_abstract.get(0))).getStr("text");
    }

    /**
     * @description 解析文件workflow流程所需文件信息
     * @author xiashenghui
     * @updateTime 2022/9/15
     */
    private DocAuditApplyModel getFileDetails(DocAuditApplyModel docAuditApplyModel){
        Map<String, Object> obj = JSON.parseObject(this.getMessage(), HashMap.class);
        Map<String, Object> detailObj = Maps.newHashMap();
        obj.forEach((k, v) -> detailObj.put(StrUtil.toUnderlineCase(k), v));
        JSONObject forIntDev = JSONUtil.parseObj(detailObj.get("for_INT_Dev"));
        docAuditApplyModel.setDocId(forIntDev.getStr("gns"));
        docAuditApplyModel.setDocPath(forIntDev.getStr("url"));
        docAuditApplyModel.setDocType(forIntDev.getStr("isdir"));
        return docAuditApplyModel;
    }
}
