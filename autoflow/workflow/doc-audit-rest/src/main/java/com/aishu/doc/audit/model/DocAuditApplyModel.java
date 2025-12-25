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
import java.util.List;

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
@TableName("t_wf_doc_audit_apply")
public class DocAuditApplyModel {

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
	 * 文档名称，如：xxx.txt
	 */
	private String docNames;

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
	 * 冗余字段-流程定义KEY
	 */
	@TableField(exist = false)
	private String procDefKey;

	/**
	 * 冗余字段-任务ID
	 */
	@TableField(exist = false)
	private String taskId;

	/**
	 * 冗余字段-流程结束时间
	 */
	@TableField(exist = false)
	private Date procEndTime;

	/**
	 * 冗余字段-流程审批意见
	 */
	@TableField(exist = false)
	private Boolean auditIdea;

	/**
	 * 冗余字段-补充说明
	 */
	@TableField(exist = false)
	private String auditMsg;

	/**
	 * 冗余字段-作废申请ID
	 */
	@TableField(exist = false)
	private String conflictApplyId;

	/**
	 * 冗余字段-文档明细
	 */
	@TableField(exist = false)
	private List<DocAuditDetailModel> docAuditDetailModels;

	/**
	 * 冗余字段-作废申请ID
	 */
	@TableField(exist = false)
	private String ip;

	/**
	 * 冗余字段-附件列表
	 */
	@TableField(exist = false)
	private List<String> attachments;

	/**
	 * 冗余字段-退回标志
	 */
	@TableField(exist = false)
	private Boolean sendBack;

	/**
	 * 冗余字段-流程实例ID
	 */
	@TableField(exist = false)
	private String preProcInstId;

	/**
	 * 冗余字段-判断是否是提交文档审核
	 */
	@TableField(exist = false)
	private Boolean isAudit;
}
