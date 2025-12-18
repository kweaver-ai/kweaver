package com.aishu.wf.core.doc.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@ApiModel(value = "校验审核权限查询对象")
@Data
public class TaskAuthCheckDTO {

    @ApiModelProperty(value = "流程实例id", example = "17b3e670-beeb-11eb-aa79-00ff18ab8db3")
    @NotBlank(message = "流程实例id不能为空")
    private String proc_inst_id;

    @ApiModelProperty(value = "类型，apply表示我的申请 task表示我的待办 history表示我的已办）", example = "apply")
    @NotBlank(message = "类型不能为空")
    private String type;
}
