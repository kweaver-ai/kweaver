package com.aishu.wf.api.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Data;

@ApiModel(value = "流程定义XML元素")
@Data
@Builder
public class ProcessBpmnXmlVO {

    @ApiModelProperty(value = "流程定义XML")
    private String bpmn_xml;

}
