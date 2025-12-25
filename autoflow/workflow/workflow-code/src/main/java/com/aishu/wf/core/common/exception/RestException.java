package com.aishu.wf.core.common.exception;

/**
 * @description 全局REST异常类
 * @author lw
 */
public class RestException extends RuntimeException {

	private static final long serialVersionUID = 1L;
	private Integer errCode = 1000;
	private Object detail;


	public RestException(String message) {
		this(1000, message);
	}

	public RestException(String errorName, String message) {
		super(message);
	}

	public RestException(Integer errorCode, String message) {
		super(message);
		this.errCode = errorCode;
	}

	public RestException(Integer errorCode, String message, Object detail) {
		super(message);
		this.errCode = errorCode;
		this.detail = detail;
	}
	
	public RestException(String message, Throwable cause) {
		super(message, cause);
	}

	public RestException(Integer errCode, String message, Throwable cause) {
		super(message, cause);
		this.errCode = errCode;
	}
	
	public Integer getErrCode() {
		return this.errCode;
	}

	public Object getDetail() {
		return this.detail;
	}

}
