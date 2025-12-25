package com.aishu.wf.core.engine.util;

import org.apache.commons.lang3.exception.ExceptionUtils;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;

public class WorkFlowException extends RuntimeException {
	private static final long serialVersionUID = 1L;
	private String webShowErrorMessage;
	private ExceptionErrorCode exceptionErrorCode;
	public WorkFlowException(ExceptionErrorCode exceptionErrorCode,String message, Throwable cause) {
		super(message, cause);
		this.webShowErrorMessage=message;
		this.exceptionErrorCode=exceptionErrorCode;
	}	
	
	public WorkFlowException(String message, Throwable cause) {
		super(message, cause);
		this.webShowErrorMessage=message;
		this.exceptionErrorCode=exceptionErrorCode;
	}	
	
	public WorkFlowException(Throwable cause) {
		super(cause);
		if(cause instanceof WorkFlowException){
			this.webShowErrorMessage=((WorkFlowException)cause).getWebShowErrorMessage();
			this.exceptionErrorCode=((WorkFlowException)cause).getExceptionErrorCode();
		}
	}

	public WorkFlowException(ExceptionErrorCode exceptionErrorCode,String message) {
		super(message);
		this.webShowErrorMessage=message;
		this.exceptionErrorCode=exceptionErrorCode;
	}

	public String getWebShowErrorMessage() {
		return webShowErrorMessage;
	}

	public ExceptionErrorCode getExceptionErrorCode() {
		return exceptionErrorCode;
	}

	public static WorkFlowException getWorkFlowException(Throwable exception){
		if(exception==null){
			return null;
		}
		WorkFlowException wfe=new WorkFlowException(exception);
		try{
			Throwable temp=ExceptionUtils.getRootCause(exception);
			if(temp!=null&&temp instanceof WorkFlowException){
				wfe=(WorkFlowException) temp;
			}
		}catch(Throwable t){
			
		}
		return wfe;
	}
	
}