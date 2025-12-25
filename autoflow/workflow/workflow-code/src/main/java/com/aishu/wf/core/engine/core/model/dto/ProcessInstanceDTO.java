package com.aishu.wf.core.engine.core.model.dto;

import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 流程实例列表查询对象
 *
 * @author Liuchu
 * @since 2021-3-9 15:54:51
 */
@ApiModel(value = "流程实例列表查询对象")
@Data
public class ProcessInstanceDTO extends BasePage {

    @ApiModelProperty(value = "流程定义名称", example = "共享审核流程")
    private String proc_def_name;

    @ApiModelProperty(value = "流程标题", example = "xxx提交文档共享审核")
    private String title;

    @ApiModelProperty(value = "状态（1：审核中，3：作废，5：已结束）", example = "1")
    private Integer state;

    @NotBlank(message = "流程租户ID不能为空")
    @ApiModelProperty(value = "流程租户ID", example = "workflow")
    private String tenant_id;

}
