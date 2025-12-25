package com.aishu.doc.msg.model;

import java.util.Map;

import lombok.Builder;
import lombok.Data;

/**
 * @description 消息发送请求参数对象
 * @author hanj
 */
@Data
public class EacpMsgModel {
	private String beanName;
	private String receiveType;
	private String messageType;
	private Map<String, Object> resultMap;
	
	
	/**
	 * 序列化需要
	 */
	public EacpMsgModel() {
		
	}


	public EacpMsgModel(String beanName, String receiveType, String messageType, Map<String, Object> resultMap) {
		super();
		this.beanName = beanName;
		this.receiveType = receiveType;
		this.messageType = messageType;
		this.resultMap = resultMap;
	}
	
}
