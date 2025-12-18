package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/12/27 13:21
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="加签参数实体")
public class Countersign {

    @ApiModelProperty(value = "任务ID")
    private String task_id;

    @ApiModelProperty(value = "审核模式")
    private String audit_model;

    @ApiModelProperty(value = "加签原因")
    private String reason;

    @ApiModelProperty(value = "审核员集合")
    private List<String> auditors;
}
