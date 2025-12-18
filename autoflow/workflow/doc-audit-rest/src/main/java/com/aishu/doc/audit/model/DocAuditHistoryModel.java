package com.aishu.doc.audit.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 文档审核历史实体
 * @ClassName: DocAuditHistoryModel
 * @author: ouandyang
 * @date: 2021年5月11日15:01:59
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_wf_doc_audit_history")
public class DocAuditHistoryModel {

	/**
	 * 申请ID
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

	/**
	 * 业务关联ID，如：AS共享申请ID
	 */
	private String bizId;

	/**
	 * 文档ID，如：gns://xxx/xxx
	 */
	private String docId;

	/**
	 * 文档路径，如：/name/xxx.txt
	 */
	private String docPath;

	/**
	 * 文档类型 folder文件夹,file文件
	 */
	private String docType;

	/**
	 * 文件密级,5~15，如果是文件夹，则为0
	 */
	private Integer csfLevel;

	/**
	 * 业务类型（realname共享给指定用户的申请，anonymous共享给任意用户的申请，sync同步申请，flow流转申请，security定密申请）
	 */
	private String bizType;

	/**
	 * 申请类型（sync同步申请，flow流转申请，perm共享申请，anonymous匿名申请，owner所有者申请，security定密申请，inherit更改继承申请）
	 */
	private String applyType;

	/**
	 * 申请明细
	 */
	private String applyDetail;

	/**
	 * 流程定义ID
	 */
	private String procDefId;

	/**
	 * 流程定义名称
	 */
	private String procDefName;

	/**
	 * 流程实例ID
	 */
	private String procInstId;

	/**
	 * 审核模式（tjsh-同级审核，hqsh-会签审核，zjsh-依次审核）
	 */
	private String auditType;

	/**
	 * 审核员
	 */
	private String auditor;

	/**
	 * 申请人ID
	 */
	private String applyUserId;

	/**
	 * 申请人名称
	 */
	private String applyUserName;

	/**
	 * 申请时间
	 */
	private Date applyTime;

	/**
	 * 审核状态，1-审核中 2-已拒绝 3-已通过 4-自动审核通过 5-作废
	 */
	private Integer auditStatus;

	/**
	 * 审核结果，pass-通过 reject-拒绝
	 */
	private String auditResult;

	/**
	 * 最后一次补充说明
	 */
	private String auditMsg;

	/**
	 * 最后一次修改时间
	 */
	private Date lastUpdateTime;

	/**
	 * 文档流转名称
	 */
	private String docNames;

	/**
	 * 审核员名称
	 */
	@TableField(exist = false)
	private String assigneeOrgId;

	/**
	 * 源文件名称
	 */
	@TableField(exist = false)
	private String sourceFileNames;

	/**
	 * 冗余字段-任务ID
	 */
	@TableField(exist = false)
	private String taskId;

	/**
	 * 冗余字段-作废申请ID
	 */
	@TableField(exist = false)
	private String ip;

	/**
	 * 是否是当前办件的审核员
	 */
	@TableField(exist = false)
	private boolean applicationAuditor;
}
