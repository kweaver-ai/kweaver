package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/7/7 20:10
 */
@Data
@ApiModel(value = "文件夹下载子对象")
public class FolderFileVO {

    @ApiModelProperty(value = "文件id")
    private String doc_id;

    @ApiModelProperty(value = "文件名称")
    private String name;

    @ApiModelProperty(value = "下载地址")
    private String download_url;
}
