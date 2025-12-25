package com.aishu.wf.core.engine.core.model.dto;

import javax.validation.constraints.Pattern;

import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "流程建模参数对象")
@Data
public class ExpireReminderDTO {
    @ApiModelProperty(value = "配置超时提醒开关", example = "true")
    private Boolean reminder_switch;

    @ApiModelProperty(value = "超时时长", example = "1")
    private String internal;

    @ApiModelProperty(value = "催办频率包含1、2、3、7（天）", example = "7")
    @Pattern(regexp = "^(1|2|3|7)$", message = "催办频率包含1、2、3、7（天）")
    private String frequency;

    public static void validateParameter(ExpireReminderDTO expireReminderDTO) {
        try {
            if (expireReminderDTO == null) {
                return;
            }
            int intValue = Integer.parseInt(expireReminderDTO.getInternal());
            if (intValue <= 0 || intValue > 999) {
                throw new RestException(BizExceptionCodeEnum.A400001000.getCode(),
                        BizExceptionCodeEnum.A400001000.getMessage(), "The parameter internal must be greater than zero and less than 999.");
            }
        } catch (NumberFormatException e) {
            throw new RestException(BizExceptionCodeEnum.A400001000.getCode(),
                    BizExceptionCodeEnum.A400001000.getMessage(), "the parameter internal is not a valid number.");
        }
    }
}
