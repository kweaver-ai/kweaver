package com.aishu.wf.core.common.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@ApiModel(value = "分页包装对象")
public class PageWrapper<T> {

    @ApiModelProperty(value = "数据集合")
    private List<T> entries;

    @ApiModelProperty(value = "总行数")
    private int total_count;
}
