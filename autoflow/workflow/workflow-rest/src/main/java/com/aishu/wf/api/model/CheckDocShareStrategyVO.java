package com.aishu.wf.api.model;

import com.aishu.wf.core.doc.model.dto.CheckDocShareStrategyDTO;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/7/3 14:56
 */
@ApiModel(value = "校验读取策略对象")
@Data
public class CheckDocShareStrategyVO {

    @ApiModelProperty(value = "文档库id")
    private String doc_id;

    @ApiModelProperty(value = "文档库名称")
    private String doc_name;

    public static CheckDocShareStrategyVO builder(CheckDocShareStrategyDTO checkDocShareStrategyDTO) {
        CheckDocShareStrategyVO checkDocShareStrategyVO = new CheckDocShareStrategyVO();
        checkDocShareStrategyVO.setDoc_id(checkDocShareStrategyDTO.getDoc_id());
        checkDocShareStrategyVO.setDoc_name(checkDocShareStrategyDTO.getDoc_name());
        return  checkDocShareStrategyVO;
    }
}
