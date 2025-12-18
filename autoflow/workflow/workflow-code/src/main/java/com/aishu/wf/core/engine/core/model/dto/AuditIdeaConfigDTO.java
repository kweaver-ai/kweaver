package com.aishu.wf.core.engine.core.model.dto;

import javax.validation.constraints.Pattern;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@ApiModel(value = "审核意见必填配置")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditIdeaConfigDTO {

    @ApiModelProperty(value = "配置审核意见必填时审核流程状态", example = "1")
    @Pattern(regexp = "^(1|2)$", message = "审核状态仅能配置1或2，1-审核拒绝，2-审核通过或审核拒绝")
    private String status;

    @ApiModelProperty(value = "配置审核意见必填开关", example = "true")
    private Boolean audit_idea_switch;
}
