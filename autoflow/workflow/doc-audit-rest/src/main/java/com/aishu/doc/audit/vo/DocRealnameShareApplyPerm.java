package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @description 文件共享消息权限实体
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocRealnameShareApplyPerm {
	
	@ApiModelProperty(value = "允许权限(delete删除,modify修改,create新建,preview预览,download下载,display显示)", example = "preview,display", required = true)
	private String[] allow;

	@ApiModelProperty(value = "拒绝权限(delete删除,modify修改,create新建,preview预览,download下载,display显示)", example = "delete,modify")
	private String[] deny;


}
