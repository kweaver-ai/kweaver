package com.aishu.doc.audit.model;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotBlank;
import java.util.Date;

/**
 * 文件共享实体
 * @ClassName: DocShareModel
 * @author: ouandyang
 * @date: 2021年2月2日 下午5:43:08
 */
@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_wf_doc_share")
public class DocShareModel extends DocBase {

	/**
	 * 所属文件库类型 user_doc_lib 个人文档库，department_doc_lib 部门文档库，custom_doc_lib 自定义文档库，knowledge_doc_lib 知识库
	 */
	private String docLibType;

	/**
	 * 申请类型
	 * perm表示共享申请
	 * shared_link_http表示外链申请
	 * owner表示所有者申请
	 * change_csflevel表示更改密级申请
	 * inherit表示更改继承申请
	 */
	private String type;

	/**
	 * 共享明细
	 */
	private String detail;
}
