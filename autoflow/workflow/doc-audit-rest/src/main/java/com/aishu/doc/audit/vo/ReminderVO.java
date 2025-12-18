package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @description 催办状态返回参数
 * @author siyu.chen
 */
@Data
@ApiModel(value = "催办响应体")
public class ReminderVO {

    @ApiModelProperty(value = "催办状态")
    public Boolean status;
}
