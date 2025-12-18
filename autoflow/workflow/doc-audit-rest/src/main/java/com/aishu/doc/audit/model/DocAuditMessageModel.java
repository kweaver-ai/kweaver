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
@TableName("t_wf_doc_audit_message")
public class DocAuditMessageModel {
    /**
	 * ID
	 */
	@TableId(value = "id", type = IdType.ASSIGN_UUID)
	private String id;

    /**
     * 流程实例 ID
     */
    private String procInstId;

    /**
     * 消息 channel
     */
    private String chan;

    
    /**
     * 消息内容
     */
    private String payload;

    /**
     * 消息中心消息ID
     */
    private String extMessageId;
}
