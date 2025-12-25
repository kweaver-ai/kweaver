package com.aishu.wf.core.common.exception;

/**
 * @description 校验不通过异常类
 * @author hanj
 */
public class ValidateException extends Exception {

    public ValidateException() {
        super();
    }

    public ValidateException(String message) {
        super(message);
    }

}
