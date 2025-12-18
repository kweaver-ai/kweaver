package com.aishu.wf.api.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
/**
 * @description 全局异常信息类
 * @author hanj
 */
public class ErrorInfo {
	  private String errorCode;
	  private String errMsg;
	  private String exception;
	  
//	  public static final String INTERNAL_SERVER_ERROR = "A1000";  //内部服务器错误
//	  public static final String INTERNAL_DATABASE_ERROR = "A1001"; //数据库错误
//	  public static final String INTERNAL_IP_DENEY = "A1002"; //ip地址拒绝
//	  
//	  public static final String WORKFLOW_DATA_ERROR = "B2000"; //流程数据异常
//	  public static final String WORKFLOW_PARAM_ERROR = "B2001"; //输入参数异常
//	  public static final String WORKFLOW_PROCDEF_NOT_EXIST = "B2002"; //流程定义信息不在在
//	  public static final String WORKFLOW_ACTDEF_NOT_EXIST = "B2003";
//	  public static final String WORKFLOW_PROCINST_NOT_EXIST = "B2004";
//	  public static final String WORKFLOW_ACTINST_NOT_EXIST = "B2005";
//	  public static final String WORKFLOW_NEXTACT_NOT_EXIST = "B2006";
//	  public static final String WORKFLOW_NEXTACTUSER_NOT_EXIST = "B2007";
//	  public static final String WORKFLOW_TODO_NOT_EXIST = "B2020";
//	  public static final String WORKFLOW_TODO_RECOMMIT = "B2021";
//	  
//	  public static final String READ_SYNC_ERROR = "B3000";
//	  public static final String READ_PARAM_ERROR = "B3001";
//	  
//	  public static final String COMMON_PARAM_ERROR = "B4001";
//	  public static final String COMMON_OBJECT_EXIST = "B4002";  //对象已存在
//	  public static final String COMMON_OBJECT_NOT_EXIST = "B4003";
//	  public static final String COMMON_SSO_FAULT = "B4004";

	  public ErrorInfo(String errorCode, String errMsg, Exception ex) {
		  this.errorCode = errorCode;
	      this.errMsg = errMsg;
	      if (ex != null) {
	        this.exception = ex.getLocalizedMessage();
	      }
	  }
	  
	  public String getErrorCode() {
		  return this.errorCode;
	  }
	  
	  public void setErrorCode(String errorCode) {
		  this.errorCode = errorCode;
	  }

	  public String getMessage() {
	      return errMsg;
	  }

	  public void setMessage(String message) {
	      this.errMsg = message;
	  }
	  
	  public void setException(String exception) {
	      this.exception = exception;
	  }
	  
	  @JsonInclude(Include.NON_NULL)
	  public String getException() {
	      return exception;
	  }
	}