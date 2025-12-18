package com.aishu.wf.core.doc.model.dto;

import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.engine.config.model.Dict;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/10/28 11:09
 */
@ApiModel(value = "涉密模式状态参数对象")
@Data
public class SecretDTO {

    public final static String DICT_SECRET_SWITCH = "secret_switch";

    @ApiModelProperty(value = "涉密模式状态：y：开启涉密模式；n：关闭涉密模式", example = "y" , required = true)
    @NotBlank
    @ArrayValuable(values = {"y", "n"}, message = "涉密模式状态码不正确")
    private String status;

    public static Dict builderNewDict(SecretDTO secretDTO) {
        Dict dict = new Dict();
        dict.setAppId("as_workflow");
        dict.setStatus("Y");
        dict.setDictName(secretDTO.getStatus());
        dict.setDictCode(SecretDTO.DICT_SECRET_SWITCH);
        return dict;
    }

}
