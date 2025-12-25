package com.aishu.wf.core.common.model;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @author Liuchu
 * @since 2021-3-20 16:53:30
 */
@Data
public class ValueObjectEntity {

    @ApiModelProperty(value = "ID")
    private String id;

    @ApiModelProperty(value = "名称")
    private String name;

}
