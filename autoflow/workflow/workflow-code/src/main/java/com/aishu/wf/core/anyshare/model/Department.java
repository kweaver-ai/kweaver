package com.aishu.wf.core.anyshare.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * @description 爱数部门数据实体
 * @author hanj
 */
@Setter
@Getter
@ApiModel(value = "键值对对象")
public class Department {

    @ApiModelProperty(value = "ID", example = "1c353675-7bf7-11eb-a791-0242ac120007")
    private String id;

    @ApiModelProperty(value = "名称", example = "技术中心")
    private String name;

    @ApiModelProperty(value = "类型", example = "department")
    private String type;

}
