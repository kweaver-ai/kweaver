package com.aishu.wf.api.model;

import com.aishu.wf.core.engine.config.model.Dict;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/10/28 11:16
 */
@ApiModel(value = "涉密模式状态对象")
@Data
public class SecretVO {

    @ApiModelProperty(value = "涉密模式状态：y：开启涉密模式；n：关闭涉密模式", example = "y")
    private String status;

    public static SecretVO builder(Dict secretDict) {
        SecretVO secretVO = new SecretVO();
        secretVO.setStatus("n");
        if(null != secretDict){
            secretVO.setStatus(secretDict.getDictName());
        }
        return  secretVO;
    }

}
