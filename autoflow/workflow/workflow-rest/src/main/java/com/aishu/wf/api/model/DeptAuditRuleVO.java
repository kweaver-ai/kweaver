package com.aishu.wf.api.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Data;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/4/26 9:19
 */
@ApiModel(value = "部门审核员对象")
@Data
@Builder
public class DeptAuditRuleVO {

    @ApiModelProperty(value = "部门审核员规则ID", example = "6ba69a8e-8648-11eb-b1e3-3614e324d3ec")
    private String id;
}
