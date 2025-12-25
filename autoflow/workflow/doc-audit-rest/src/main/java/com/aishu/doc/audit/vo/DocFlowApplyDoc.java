package com.aishu.doc.audit.vo;

import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * @description 文档流转消息-文档信息实体
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="文档流转消息-文档信息实体")
public class DocFlowApplyDoc {

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

	@ApiModelProperty(value = "文件密级,为文件时必填,5~15;如果为文件夹，则取文件夹底下最高文件的密级", example = "5")
	private Integer csf_level;

}
