package com.aishu.doc.audit.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * 提交文档审核流程实体
 * @ClassName: DocAudit
 * @author: ouandyang
 * @date: 2021年2月2日 下午5:43:08
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="提交文档审核流程实体")
public class DocAuditModel {

	@NotBlank
	@ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
	private String applyId;

	@NotBlank
	@ApiModelProperty(value = "任务ID", example = "956f8507-83f2-11eb-aac3-0e6b630d74ce", required = true)
	private String taskId;

	@NotNull
	@ApiModelProperty(value = "流程审批意见", example = "true", required = true)
	private Boolean auditIdea;

	@Size(max= 800 ,message= "补充说明长度不能超过{max}位" )
	@ApiModelProperty(value = "补充说明", example = "同意")
	private String auditMsg;
}
