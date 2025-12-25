package com.aishu.wf.core.engine.core.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 
 */
@ApiModel(value = "自定义审核策略项查询对象")
@Data
public class ProcessStrategyTagDTO extends BasePage {
    @ApiModelProperty(value = "流程租户ID", example = "workflow")
    private String tenant_id;

}

