package com.aishu.wf.core.common.model;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @description 分页基础类
 * @author hanj
 * @version 1.0
 */
@Data
public class BasePage {

    @ApiModelProperty(value = "偏移量")
    protected Integer offset = 0;

    @ApiModelProperty(value = "每页最多返回数目数")
    protected Integer limit = 20;

    @ApiModelProperty(value = "当前页", hidden = true)
    protected Integer pageNumber;

    @ApiModelProperty(value = "每页数量", hidden = true)
    protected Integer pageSize;

}
