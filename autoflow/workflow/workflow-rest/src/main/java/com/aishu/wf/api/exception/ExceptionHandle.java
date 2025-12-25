package com.aishu.wf.api.exception;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.cache.ProcessExeErrorShare;
import com.aishu.wf.core.engine.util.WorkFlowException;
import org.activiti.engine.ActivitiObjectNotFoundException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.Map;
/**
 * @description 全局REST异常处理类
 * @author hanj
 */
@ControllerAdvice
public class ExceptionHandle {
	protected Logger logger = LoggerFactory.getLogger(getClass());

	/**
	 * @description 处理异常-ActivitiObjectNotFoundException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseBody
	@ExceptionHandler
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ErrorInfo handleNotFound(ActivitiObjectNotFoundException e) {
		return new ErrorInfo(ExceptionErrorCode.B2000.name(), "Object Not found", e);
	}

	/**
	 * @description 处理异常-WorkFlowException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleWorkFlowException(WorkFlowException e) {
		logger.error("",e);
		return new ErrorInfo(e.getExceptionErrorCode().name() ,e.getMessage(), e);
	}

	/**
	 * @description 处理异常-RestException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleRestException(RestException e) {
		logger.error("",e);
		return new ErrorInfo(e.getErrCode(), e.getMessage(), e);
	}

	/**
	 * @description 处理异常-NullPointerException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleNullPointerException(NullPointerException e) {
		logger.error("",e);
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "Null Pointer", e);
	}

	/**
	 * @description 处理异常-NoHandlerFoundException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(value=HttpStatus.NOT_FOUND)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleNoHandlerFoundException(NoHandlerFoundException e) {
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "No HandlerFound", e);
	}

	/**
	 * @description 处理异常-HttpMessageNotReadableException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleJsonPropertyException(HttpMessageNotReadableException e) {
		logger.warn("",e);
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "Json Error", e);
	}

	/**
	 * @description 处理异常-HttpRequestMethodNotSupportedException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "Http Method Error", e);
	}

	/**
	 * @description 处理异常-HttpMediaTypeNotSupportedException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException e) {
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "Media Type Error", e);
	}

	/**
	 * @description 处理异常-IllegalArgumentException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleIllegalArgumentException(IllegalArgumentException e) {
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "Illegal Argument", e);
	}

	/**
	 * @description 处理异常-UnexpectedRollbackException
	 * @author hanj
	 * @param  e
	 * @updateTime 2021/5/13
	 */
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	@ResponseBody
	@ExceptionHandler
	public ErrorInfo handleUnexpectedRollbackException(UnexpectedRollbackException e) {
		logger.error("",e);
		Map resultMap=ProcessExeErrorShare.getProcessExeErrorData();
		if(resultMap!=null){
			ExceptionErrorCode exceptionErrorCode=(ExceptionErrorCode) resultMap.get("executeErrorCode");
			String executeErrorMsg=(String) resultMap.get("executeErrorMsg");
			if(StringUtils.isNotEmpty(executeErrorMsg)){
				return new ErrorInfo(exceptionErrorCode.name(), executeErrorMsg, e);
			}
		}
		return new ErrorInfo(ExceptionErrorCode.A1000.name(), "Database Error", e);
	}
}
