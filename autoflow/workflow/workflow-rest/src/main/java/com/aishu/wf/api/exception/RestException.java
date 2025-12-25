package com.aishu.wf.api.exception;
/**
 * @description 全局REST异常类
 * @author hanj
 */
public class RestException extends RuntimeException {

	private static final long serialVersionUID = 1L;
	private String errCode = "A1000";


	public RestException(String message) {
		this("A1000", message);
	}
	
	public RestException(String errorCode, String message) {
		super(message);
		this.errCode = errorCode;
	}
	
	public String getErrCode() {
		return this.errCode;
	}

}
