package com.aishu.doc.audit.vo;

import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @description 文件共享消息实体-访问者信息
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocRealnameShareApplyAccessor {
	

	@ApiModelProperty(value = "访问者", example = "zhangsan")
	private String id;
	

	@ApiModelProperty(value = "访问者名称", example = "张三")
	private String name;
	

	@ArrayValuable(values = {"user", "department", "contactor", "group"}, message = "accessor.type类型不正确")
	@ApiModelProperty(value = "访问者类型；user-用户，department-组织，contactor-联系人组，group-用户组", example = "user")
	private String type;
	
}
