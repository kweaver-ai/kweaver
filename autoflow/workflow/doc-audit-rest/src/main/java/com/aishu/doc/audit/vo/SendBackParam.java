package com.aishu.doc.audit.vo;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import java.util.List;

/**
 * @description 提交审核对象
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="提交审核参数对象")
public class SendBackParam {

	@NotBlank
	@ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
	private String id;

	@NotBlank
	@ApiModelProperty(value = "任务ID", example = "956f8507-83f2-11eb-aac3-0e6b630d74ce", required = true)
	private String task_id;

	@Size(max= 4000 ,message= "审核意见长度不能超过800位" )
	@ApiModelProperty(value = "审核意见", example = "同意")
	private String audit_msg;

	@ApiModelProperty(value = "审核退回", example = "true")
	private Boolean send_back;

	@ApiModelProperty(value = "审核附件", example = "gns://E4F6D46EE5F649D4A8E1B5A510FF4375")
	private List<String> attachments;

	/**
	 * @description 转驼峰格式文档审核对象
	 * @author siyu.chen
	 * @param  docAuditApplyModel
	 * @updateTime 2024/7/7
	 */
	public void buildDocAuditApplyModel(DocAuditApplyModel docAuditApplyModel){
		docAuditApplyModel.setAuditIdea(false);
		docAuditApplyModel.setAuditMsg(this.getAudit_msg());
		docAuditApplyModel.setTaskId(this.getTask_id());
		docAuditApplyModel.setAttachments(this.getAttachments());
		docAuditApplyModel.setSendBack(true);
	}
}
