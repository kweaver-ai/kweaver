package com.aishu.wf.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
@ApiModel(value = "流程定义对象")
public class ProcessDefinitionVO implements Serializable {

	private static final long serialVersionUID = -3684333557455647214L;

	@ApiModelProperty(name = "proc_def_key", value = "流程定义KEY", example = "Process_QM57BLUS")
	@JsonProperty("proc_def_key")
	private String procDefKey;

	@ApiModelProperty(name = "proc_def_name", value = "流程定义名称", example = "共享审核流程")
	@JsonProperty("proc_def_name")
	private String procDefName;

	@ApiModelProperty(name = "description", value = "说明", example = "我是备注")
	private String description;

	@ApiModelProperty(name = "type_id", value = "流程类型", example = "doc_share")
	@JsonProperty("type_id")
	private String typeId;

	@ApiModelProperty(name = "type_name", value = "流程类型名称", example = "文档共享审核")
	@JsonProperty("type_name")
	private String typeName;

	@ApiModelProperty(name = "order", value = "排序号", example = "1")
	private Integer order;
	
	@ApiModelProperty(name = "create_user", value = "创建人", example = "admin")
	@JsonProperty("create_user")
	private String createUser;
	
	@ApiModelProperty(name = "create_time", value = "创建时间", example = "2021-03-04 10:39:08")
	@JsonProperty("create_time")
	private Date createTime;
	
}
