package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "文件夹下载对象")
public class FolderDownloadVO {

    @ApiModelProperty(value = "文件夹下载集合")
    private List<FolderVO> folder_download_list = new ArrayList<>();

    @ApiModelProperty(value = "文件夹子文件总条目")
    private Integer folder_total = 0;

}
