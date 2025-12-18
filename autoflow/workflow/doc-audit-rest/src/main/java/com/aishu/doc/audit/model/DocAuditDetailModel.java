package com.aishu.doc.audit.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文档审核历史实体
 * @ClassName: DocAuditDetailModel
 * @author: ouandyang
 * @date: 2022年3月17日16:36:22
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_wf_doc_audit_detail")
public class DocAuditDetailModel {

	/**
	 * 主键ID
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

	/**
	 * 申请ID
	 */
	private String applyId;

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
	 * 文件名称
	 * */
	private String docName;

}
