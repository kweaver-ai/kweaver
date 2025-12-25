package com.aishu.wf.core.engine.core.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * @description
 * @author hanj
 */
@ApiModel(value = "流程高级设置参数对象")
@Data
public class AdvancedSetupDTO {

    @ApiModelProperty(value = "实名自动审核开关（开启：y;关闭：n）", example = "y")
    @Size(max = 1,message = "实名自动审核开关不能超过1")
    private String rename_switch;

    @ApiModelProperty(value = "匿名自动审核开关（开启：y;关闭：n）", example = "y")
    @Size(max = 1,message = "匿名自动审核开关不能超过1")
    private String anonymity_switch;

    @ApiModelProperty(value = "当同一个审核员重复审核同一申请时规则类型（只需审核一次：once;每次都需要审核：always）", example = "once")
    @Pattern(regexp = "once|always", message = "当同一个审核员重复审核同一申请时规则类型不正确")
    private String repeat_audit_rule;

    @ApiModelProperty(value = "申请人预览下载审核附件配置信息")
    @Valid
    private PermConfigDTO perm_config;

    @ApiModelProperty(value = "编辑权限开关", example = "true")
    private Boolean edit_perm_switch;

    @ApiModelProperty(value = "审核意见支持必填开关", example = "true")
    private AuditIdeaConfigDTO audit_idea_config;

    @ApiModelProperty(value = "审核到期提醒")
    @Valid
    private ExpireReminderDTO expire_reminder;
}
