package com.aishu.wf.core.common.exception;

/**
 * @description 全局记录不存在异常类
 * @author siyu.chen
 */
public class NotFoundException extends RuntimeException{
    private Integer errCode;
    private Object detail;

    public NotFoundException(Integer errorCode, String message) {
        super(message);
        this.errCode = errorCode;
    }

    public NotFoundException(Integer errorCode, String message, Object detail) {
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
