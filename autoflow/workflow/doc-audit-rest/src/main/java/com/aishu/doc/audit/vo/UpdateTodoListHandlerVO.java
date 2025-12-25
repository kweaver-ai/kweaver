package com.aishu.doc.audit.vo;

import javax.validation.constraints.NotBlank;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "转审参数实体")
public class UpdateTodoListHandlerVO {


  @NotBlank(message = "处理人不能为空")
  @ApiModelProperty(value = "处理人ID")
  private String handlerId;
}
