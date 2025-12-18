package com.aishu.doc.audit.vo;

import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * @description 文件共享消息实体-文档信息
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocShareApplyDoc {
	
	@NotBlank(message = "doc.id不能为空")
	@ApiModelProperty(value = "文档ID", example = "gns://F00178FB1D3F4545B0D7E146ABB5943A/AA65BA073BBA4A328EE8FE86BBEA2ABB", required = true)
	private String id;
	
	@NotBlank(message = "doc.path不能为空")
	@ApiModelProperty(value = "文档路径", example = "/张三/文本.txt", required = true)
	private String path;
	
	@NotBlank(message = "doc.type不能为空")
	@ArrayValuable(values = {"folder", "file"}, message = "doc.type类型不正确")
	@ApiModelProperty(value = "文档类型 folder文件夹,file文件", example = "file", required = true)
	private String type;

	@NotBlank(message = "doc.doc_lib_type不能为空")
	@ArrayValuable(values = {"user_doc_lib", "department_doc_lib", "custom_doc_lib", "knowledge_doc_lib"}, message = "所属文件库类型不正确")
	@ApiModelProperty(value = "所属文件库类型 user_doc_lib 个人文档库，department_doc_lib 部门文档库，custom_doc_lib 自定义文档库， knowledge_doc_lib 知识库", example = "user_doc_lib", required = true)
	private String doc_lib_type;

	@ApiModelProperty(value = "文件密级,为文件时必填,5~15", example = "5")
	private Integer csf_level;

	@ApiModelProperty(value = "文件夹密级,为文件夹时必填", example = "5")
	private Integer max_csf_level;
	
}
