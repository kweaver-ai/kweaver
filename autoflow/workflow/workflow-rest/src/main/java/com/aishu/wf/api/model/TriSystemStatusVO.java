package com.aishu.wf.api.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "三权分立开启状态")
@Data
public class TriSystemStatusVO {

    @ApiModelProperty(value = "是否开启", example = "false")
    private Boolean status;

    public static TriSystemStatusVO builder(boolean status) {
        TriSystemStatusVO triSystemStatusVO = new TriSystemStatusVO();
        triSystemStatusVO.setStatus(status);
        return triSystemStatusVO;
    }
}
