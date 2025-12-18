package com.aishu.wf.core.common.exception;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * @description 错误信息类
 * @author hanj
 */
@ApiModel(value = "错误信息对象")
@Getter
@Setter
@Builder
public class ErrorInfo {

    @ApiModelProperty(value = "错误的原因")
    private String cause;

    @ApiModelProperty(value = "业务错误码")
    private Integer code;

    @ApiModelProperty(value = "业务错误信息")
    private String message;

    @ApiModelProperty(value = "错误详细信息")
    private Object detail;

    public static ErrorInfo result(Integer code, String cause, String message) {
        return ErrorInfo.builder().code(code).cause(cause).message(message).build();
    }

    public static ErrorInfo result(Integer code, String cause, String message, Object detail) {
        return ErrorInfo.builder().code(code).cause(cause).message(message).detail(detail).build();
    }

}
