package com.aishu.wf.core.doc.model.dto;
import com.aishu.wf.core.common.model.BasePage;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;


/**
 * @Description free-audit列表查询参数
 * @Author crzep
 * @Date 2021/4/14 19:57
 * @VERSION 1.0
 **/
@ApiModel(value = "free-audit列表查询参数")
@Data
public class FreeAuditDeptQueryDTO extends BasePage {

    @ApiModelProperty(value = "搜索匹配字符", hidden = true)
    private String search;

}