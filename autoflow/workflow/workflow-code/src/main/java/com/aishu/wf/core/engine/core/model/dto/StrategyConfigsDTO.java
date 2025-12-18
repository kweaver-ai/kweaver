package com.aishu.wf.core.engine.core.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@ApiModel(value = "流程高级设置配置参数对象")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrategyConfigsDTO {

    @ApiModelProperty(value = "配置审核员编辑申请文件权限开关", example = "true")
    private Boolean editPermSwitch;

    @ApiModelProperty(value = "配置审核意见是否必填开关", example = "true")
    private AuditIdeaConfigDTO auditIdeaConfig;
}
