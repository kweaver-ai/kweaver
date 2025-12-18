package com.aishu.wf.core.doc.model.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

import com.aishu.wf.core.engine.config.model.Dict;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "邮件开关参数对象")
@Data
public class EmailSwitchDTO {
    public final static String DICT_EMAIL_SWITCH = "email_switch";

    @ApiModelProperty(value = "审核类型", example = "flow", required = true)
    private String type;

    @ApiModelProperty(value = "邮件开关状态", example = "y", required = true)
    private String status;

    public static Dict builderNewDict(EmailSwitchDTO emailSwitchDTO) {
        Dict dict = new Dict();
        dict.setAppId("as_workflow");
        dict.setStatus("Y");
        dict.setDictCode(buildDictName(emailSwitchDTO.getType()));
        dict.setDictName(emailSwitchDTO.getStatus());
        return dict;
    }

    public static String buildDictName(String applyType) {
        return String.format("%s_email_switch", applyType);
    }
}
