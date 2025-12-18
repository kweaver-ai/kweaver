package com.aishu.doc.audit.model;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_wf_doc_audit_message_receiver")
public class DocAuditMessageReceiverModel {
     /**
	 * ID
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

	/**
	 * 消息ID
	 */
    private String messageId;

	/*
	 * 接收者ID
	 */
	private String receiverId;

	/**
	 * 处理者ID
	 */
	private String handlerId;

	/**
	 * 处理结果
	 */
	private String auditStatus;
}
