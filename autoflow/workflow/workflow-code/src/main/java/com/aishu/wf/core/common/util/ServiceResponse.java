package com.aishu.wf.core.common.util;

import java.util.Date;

import org.apache.commons.lang.builder.ToStringBuilder;

/**
 * 服务接口响应对象，所有服务接口中写数据方法的返回对象
 * 
 * @author lw
 * @version 1.0
 * @created 07-四月-2013 15:40:37
 */
public class ServiceResponse<T>   implements java.io.Serializable{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	/**
	 * 响应状态，SUCCESS：操作成功、PARAMS_ERROR：参数错误、ERROR：系统异常
	 */
	public static final String STATUS_OP_SUCCESS = "SUCCESS";
	public static final String STATUS_OP_ERROR = "ERROR";
	public static final String STATUS_PARAMS_ERROR = "PARAMS_ERROR";
	/**
	 * 请求操作的状态
	 */
	private String status;
	/**
	 * 响应结果信息
	 */
	private String resultMsg;
	/**
	 * 响应业务结果对象，可为空
	 */
	private T resultObj;
	/**
	 * 响应时间
	 */
	private Date responseTime;

	public ServiceResponse(String status, String resultMsg, T resultObj,
			Date responseTime) {
		super();
		this.status = status;
		this.resultMsg = resultMsg;
		this.resultObj = resultObj;
		this.responseTime = responseTime;
	}
	
	public ServiceResponse(T resultObj,
			Date responseTime) {
		super();
		this.resultObj = resultObj;
		this.responseTime = responseTime;
	}
	public ServiceResponse(Date responseTime) {
		super();
		this.responseTime = responseTime;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getResultMsg() {
		return resultMsg;
	}

	public void setResultMsg(String resultMsg) {
		this.resultMsg = resultMsg;
	}

	public T getResultObj() {
		return resultObj;
	}

	public void setResultObj(T resultObj) {
		this.resultObj = resultObj;
	}

	public Date getResponseTime() {
		return responseTime;
	}

	public void setResponseTime(Date responseTime) {
		this.responseTime = responseTime;
	}
	@Override
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}

	
	public ServiceResponse<T> build(String status, String resultMsg,T resultObj){
		this.status = status;
		this.resultMsg = resultMsg;
		this.resultObj=resultObj;
		return this;
	}
	
	public ServiceResponse build(String status, String resultMsg){
		this.status = status;
		this.resultMsg = resultMsg;
		return this;
	}
}