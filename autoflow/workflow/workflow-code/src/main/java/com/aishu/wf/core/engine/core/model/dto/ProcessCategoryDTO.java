package com.aishu.wf.core.engine.core.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 流程分类列表查询对象
 *
 * @author yan.nan
 * @since 2023-5-6 15:54:51
 */
@ApiModel(value = "流程分类列表查询对象")
@Data
public class ProcessCategoryDTO extends BasePage {
    @ApiModelProperty(value = "流程租户ID", example = "workflow")
    private String tenant_id;

}

