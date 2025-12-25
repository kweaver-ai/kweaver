package com.aishu.wf.core.doc.model.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * @description 创建免审部门所需传入信息
 * @author crzep
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="自动审核部门参数对象")
public class FreeAuditDeptDTO {

    @NotBlank
    @Size(max= 100 ,message= "部门id不能超过100位" )
    @ApiModelProperty(value = "部门id", required = true)
    private String department_id;

    @NotBlank
    @Size(max= 100 ,message= "部门名不能超过100位" )
    @ApiModelProperty(value = "部门名", required = true)
    private String department_name;
}