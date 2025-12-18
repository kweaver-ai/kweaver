package com.aishu.wf.core.engine.core.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Pattern;

@ApiModel(value = "流程高级设置申请者权限配置参数对象")
@Data
public class PermConfigDTO {
    
    @ApiModelProperty(value = "申请人配置预览下载权限时审核流程状态", example = "1")
    @Pattern(regexp = "^(1|2)$", message = "审核状态仅能配置1或2，1-审核通过，2-审核通过或审核拒绝")
    private String status;

    @ApiModelProperty(value = "申请人配置预览下载权限开关", example = "true")
    private Boolean perm_switch;

    @ApiModelProperty(value = "附件有效期时间，7、15、30（天）", example = "7")
    @Pattern(regexp = "^(7|15|30)$", message = "附件有效期仅包括7、15、30（天）")
    private String expired;
}
