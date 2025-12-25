package com.aishu.wf.api.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Data;

@ApiModel(value = "是否存在某元素对象")
@Data
@Builder
public class ExistenceVO {

    @ApiModelProperty(value = "是否存在", example = "true")
    private Boolean exists;

}
