package com.aishu.wf.core.common.exception;

/**
 * @description 全局操作禁止异常类
 * @author siyu.chen
 */
public class ForbiddenException extends RuntimeException {
    private Integer errCode;
    private Object detail;

    public ForbiddenException(Integer errorCode, String message) {
        super(message);
        this.errCode = errorCode;
    }

    public ForbiddenException(Integer errorCode, String message, Object detail) {
        super(message);
        this.errCode = errorCode;
        this.detail = detail;
    }

    public Integer getErrCode() {
        return this.errCode;
    }

    public Object getDetail() {
        return this.detail;
    }
}
