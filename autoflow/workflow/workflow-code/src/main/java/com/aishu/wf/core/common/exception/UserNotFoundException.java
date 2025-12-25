package com.aishu.wf.core.common.exception;

import lombok.Getter;
import lombok.Setter;

/**
 * @description 用户不存在异常类型
 * @author hanj
 */
@Getter
@Setter
public class UserNotFoundException extends Exception {

    public UserNotFoundException() {
        super();
    }

    public UserNotFoundException(String message) {
        super(message);
    }

}
