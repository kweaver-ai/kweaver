package com.aishu.wf.core.engine.config.model;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.FastjsonTypeHandler;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 字典对象
 *
 * @author Liuchu
 * @since 2021-02-23 11:45:23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Getter
@TableName(value = "t_wf_dict", autoResultMap = true)
public class Dict implements Serializable {

	private static final long serialVersionUID = 1L;

	/**
	 * 主键id
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

	/**
	 * 字典编码
	 */
	@TableField("dict_code")
	private String dictCode;

	/**
	 * 父编码
	 */
	@TableField("dict_parent_id")
	private String dictParentId;

	/**
	 * 字典名称
	 */
	@TableField("dict_name")
	private String dictName;

	/**
	 * 排序号
	 */
	@TableField("sort")
	private Integer sort;

	/**
	 * 状态Y:启用 N:禁用
	 */
	@TableField("status")
	private String status;

	/**
	 * 创建人
	 */
	@TableField("creator_id")
	private String creatorId;

	/**
	 * 创建时间
	 */
	@TableField("create_date")
	private Date createDate;

	/**
	 * 最后更新人
	 */
	@TableField("updator_id")
	private String updatorId;

	/**
	 * 最后更新时间
	 */
	@TableField("update_date")
	private Date updateDate;

	/**
	 * 应用id
	 */
	@TableField("app_id")
	private String appId;

	/**
	 * 字典子级
	 */
	@TableField(value = "dict_value", typeHandler = FastjsonTypeHandler.class)
	private List<DictChild> dictValue;

	@TableField(exist = false)
	@Builder.Default
	private String sortColumns = "sort asc";
}
