package com.aishu.doc.audit.vo;

import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/6/8 15:55
 */
@Data
@ApiModel(value = "副文档对象")
public class SubDocumentVO {

    @ApiModelProperty(name = "status", value = "状态码， 0表示未开始 1表示正在进行中 2表示已完成", example = "2")
    @JsonProperty("status")
    private Long status;

    @ApiModelProperty(name = "editor", value = "文件大小", example = "30144")
    @JsonProperty("size")
    private Long size;

    @ApiModelProperty(name = "file_name", value = "文件名字", example = "项目测试计划.pdf")
    @JsonProperty("file_name")
    private String file_name;

    @ApiModelProperty(name = "url", value = "文件url地址", example = "")
    @JsonProperty("url")
    private String url;

    @ApiModelProperty(name = "sub_doc_id", value = "子docid", example = "BD8C476C60634195A5F01996569D2F1A")
    @JsonProperty("sub_doc_id")
    private String sub_doc_id;

    public static SubDocumentVO builder(JSONObject jsonObject) {
        SubDocumentVO deputyDocumentVO = new SubDocumentVO();
        deputyDocumentVO.setStatus(Long.valueOf(jsonObject.getString("status")));
        deputyDocumentVO.setSize(Long.valueOf(jsonObject.getString("size")));
        deputyDocumentVO.setFile_name(jsonObject.getString("file_name"));
        deputyDocumentVO.setUrl(jsonObject.getString("url"));
        deputyDocumentVO.setSub_doc_id(jsonObject.getString("sub_doc_id"));
        return deputyDocumentVO;
    }
}
