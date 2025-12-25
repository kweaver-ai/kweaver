package com.aishu.wf.core.common.exception;

/**
 * @description 全局内部服务异常类
 * @author siyu.chen
 */
public class InternalException extends RuntimeException {
    private Integer errCode;
    private Object detail;

    public InternalException(String message) {
        super(message);
    }

    public InternalException(Integer errorCode, String message) {
        super(message);
        this.errCode = errorCode;
    }

    public InternalException(Integer errorCode, String message, Object detail) {
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
