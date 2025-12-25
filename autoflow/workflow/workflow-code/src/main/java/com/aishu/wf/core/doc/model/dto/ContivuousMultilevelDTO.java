package com.aishu.wf.core.doc.model.dto;

import java.util.List;

import io.swagger.annotations.ApiModel;
import lombok.Data;

@ApiModel(value = "连续多级参数对象")
@Data
public class ContivuousMultilevelDTO {
	
	private String level;
	
	private List<String> multilevelAssigneeList;

}
