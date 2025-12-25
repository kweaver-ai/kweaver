package com.aishu.wf.core.common.exception;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aishu.wf.core.engine.util.WorkFlowException;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;

import java.sql.SQLException;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @description 全局异常处理类
 * @author hanj
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ErrorInfo restMethodArgumentNotReadbleException(HttpMessageNotReadableException e) {
        log.warn("", e);
        String message = Objects.requireNonNull(e.getHttpInputMessage().toString());
        return ErrorInfo.result(BizExceptionCodeEnum.A400057001.getCode(),
        BizExceptionCodeEnum.A400057001.getMessage(), message);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ErrorInfo restMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        log.warn("", e);
        String message = Objects.requireNonNull(e.getBindingResult().getFieldError()).getDefaultMessage();
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), message);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = MissingServletRequestParameterException.class)
    public ErrorInfo restMissingServletRequestParameterException(MissingServletRequestParameterException e) {
        log.warn("", e);
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), "参数" + e.getParameterName() + "不能为空");
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = MissingRequestHeaderException.class)
    public ErrorInfo restMissingRequestHeaderException(MissingRequestHeaderException e) {
        log.warn("", e);
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), "缺失请求头参数：" + e.getHeaderName());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = TypeMismatchException.class)
    public ErrorInfo typeMismatchException(TypeMismatchException e) {
        log.warn("", e);
        String msg = "参数类型不匹配,参数" + e.getPropertyName() + "类型应该为" + e.getRequiredType();
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), msg);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = BindException.class)
    public ErrorInfo bindException(BindException e) {
        log.warn("", e);
        StringBuilder builder = new StringBuilder();
        for (FieldError fieldError : e.getFieldErrors()) {
            if (StrUtil.isNotBlank(builder.toString())) {
                builder.append(",");
            }
            builder.append(fieldError.getField()).append(" 字段值不能 ").append(fieldError.getRejectedValue());
        }
        String msg = "参数类型不匹配";
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), builder.toString(), msg);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = WorkFlowException.class)
    public ErrorInfo handlerWorkFlowException(WorkFlowException e) {
        log.warn("", e);
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), e.getWebShowErrorMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(ConstraintViolationException.class)
    public ErrorInfo constraintViolationExceptionHandler(ConstraintViolationException e) {
        log.warn("", e);
        // String message = e.getConstraintViolations().stream().map(ConstraintViolation::getMessage).collect(Collectors.joining());
        String message = e.getConstraintViolations().stream().map(ConstraintViolation::getMessage).collect(Collectors.joining());
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), message);
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(value = Exception.class)
    public ErrorInfo handlerException(Exception e) {
        log.warn("", e);
        if (isSqlException(e)) {
            return ErrorInfo.result(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "an internal error occurred during database operation", "服务器出现错误，请稍后再试");
        }
        return ErrorInfo.result(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                e.getMessage(), "服务器出现错误，请稍后再试");
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = IllegalArgumentException.class)
    public ErrorInfo handlerIllegalArgumentException(IllegalArgumentException e) {
        log.warn("", e);
        return ErrorInfo.result(HttpStatus.BAD_REQUEST.value(), e.getMessage(), e.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(value = RestException.class)
    public ErrorInfo handlerRestException(RestException e) {
        log.warn("", e);
        return ErrorInfo.result(e.getErrCode(), e.getMessage(), e.getMessage(), e.getDetail());
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    @ExceptionHandler(value = ForbiddenException.class)
    public ErrorInfo handlerForbiddenException(ForbiddenException e) {
        log.warn("", e);
        return ErrorInfo.result(e.getErrCode(), e.getMessage(), e.getMessage(), e.getDetail());
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(value = NotFoundException.class)
    public ErrorInfo handlerNotFoundException(NotFoundException e) {
        log.warn("", e);
        return ErrorInfo.result(e.getErrCode(), e.getMessage(), e.getMessage(), e.getDetail());
    }

    // isSqlException 判断是否为 SQL 语法错误的方法
    private static boolean isSqlException(Throwable throwable) {
        while (throwable != null) {
            if (throwable instanceof SQLException) {
                return true;
            }
            throwable = throwable.getCause();
        }
        return false;
    }
}
