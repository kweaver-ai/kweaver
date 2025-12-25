package com.aishu.doc.audit.model.dto;

import java.util.List;

import com.aishu.doc.audit.model.DocAuditMessageReceiverModel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocAuditMessageWithReceiversDTO {

    /**
     * 消息 ID
     */
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

    /**
     * 消息接收者
     */
    private List<DocAuditMessageReceiverModel> receivers;
}
