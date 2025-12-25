package com.aishu.wf.api.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Data;

@ApiModel(value = "流程部署对象")
@Data
@Builder
public class ProcessDeploymentVO {

    @ApiModelProperty(value = "流程定义ID", example = "Process_20YPUS2H:2:6ba69a8e-8648-11eb-b1e3-3614e324d3ec")
    private String id;

}
