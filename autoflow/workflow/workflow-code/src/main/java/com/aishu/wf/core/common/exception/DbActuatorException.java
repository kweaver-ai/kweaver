package com.aishu.wf.core.common.exception;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/9/7 15:40
 */
public class DbActuatorException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public DbActuatorException(String message, Throwable cause) {
        super(message, cause);
    }

    public DbActuatorException(String message) {
        super(message);
    }

}
