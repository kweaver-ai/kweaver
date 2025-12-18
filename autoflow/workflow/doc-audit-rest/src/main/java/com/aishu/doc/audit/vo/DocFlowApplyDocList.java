package com.aishu.doc.audit.vo;

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
@ApiModel(value="文档流转消息-可流转文档实体")
public class DocFlowApplyDocList {

	@NotBlank(message = "doc_list.id不能为空")
	@ApiModelProperty(value = "文档gns路径", example = "Anyshare://xxxxxx/xxxxxx", required = true)
	private String id;

	@NotBlank(message = "doc_list.path不能为空")
	@ApiModelProperty(value = "文档路径", example = "/张三/文本.txt", required = true)
	private String path;

	@NotBlank(message = "doc_list.version不能为空")
	@ApiModelProperty(value = "文档版本", example = "2", required = true)
	private String version;

}
