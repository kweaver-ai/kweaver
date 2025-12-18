package com.aishu.doc.audit.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文档审核申请实体
 * @ClassName: DocAuditApplyModel
 * @author: ouandyang
 * @date: 2021年5月11日15:02:03
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_wf_internal_group")
public class InternalGroupModel {

	/**
	 * 申请ID
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

	/**
	 * 业务关联ID，如：AS共享申请ID
	 */
	private String applyID;

	/**
	 * 流程发起人ID
	 */
	private String applyUserID;

	/**
	 * 内部组ID
	 */
	private String groupID;

	/**
	 * 内部组过期时间
	 */
	private long expiredAt;

	/**
	 * 创建时间
	 */
	private long createdAt;
}
