package com.aishu.doc.audit.vo;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/6/8 15:55
 */
@Data
@ApiModel(value = "主文档对象")
public class MasterDocumentVO {

    private static final long serialVersionUID = -3684333557455647214L;

    @ApiModelProperty(name = "authrequest", value = "授权的请求体", example = "")
    @JsonProperty("authrequest")
    private List<String> authrequest;

    @ApiModelProperty(name = "client_mtime", value = "客户端时间", example = "1618566636894000")
    @JsonProperty("client_mtime")
    private Long client_mtime;

    @ApiModelProperty(name = "editor", value = "修改人", example = "cd146dcc-8e9f-11eb-8826-080027383fc3")
    @JsonProperty("editor")
    private String editor;

    @ApiModelProperty(name = "modified", value = "修改时间", example = "1619331560488041")
    @JsonProperty("modified")
    private Long modified;

    @ApiModelProperty(name = "name", value = "文件名称", example = "新建文本文档.txt")
    @JsonProperty("name")
    private String name;

    @ApiModelProperty(name = "rev", value = "文件版本号", example = "610FAEEF04B04E238506701757101506")
    @JsonProperty("rev")
    private String rev;

    @ApiModelProperty(name = "size", value = "文件大小", example = "1367")
    @JsonProperty("size")
    private Long size;

    public static MasterDocumentVO builder(JSONObject jsonObject) {
        MasterDocumentVO documentVO = new MasterDocumentVO();
        List<String> Authrequest = JSON.parseArray(jsonObject.getString("authrequest"), String.class);
        documentVO.setAuthrequest(Authrequest);
        documentVO.setClient_mtime(Long.valueOf(jsonObject.getString("client_mtime")));
        documentVO.setEditor(jsonObject.getString("editor"));
        documentVO.setModified(Long.valueOf(jsonObject.getString("modified")));
        documentVO.setName(jsonObject.getString("name"));
        documentVO.setSize(Long.valueOf(jsonObject.getString("size")));
        return documentVO;
    }
}
