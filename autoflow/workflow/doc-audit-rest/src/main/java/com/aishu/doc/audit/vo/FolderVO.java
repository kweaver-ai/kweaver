package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/7/7 17:58
 */
@Data
@ApiModel(value = "文件夹下载子对象")
public class FolderVO {

    @ApiModelProperty(value = "文件夹名称")
    private String folder_name = "";

    @ApiModelProperty(value = "文件集合")
    private List<FolderFileVO> download_file_list = new ArrayList<>();

}
