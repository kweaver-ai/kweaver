package com.aishu.doc.audit.vo;

import cn.hutool.core.util.StrUtil;
import com.aishu.doc.audit.service.DocumentService;
import com.aishu.wf.core.common.exception.RestException;
import com.alibaba.fastjson.JSONObject;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/6/2 15:54
 */
@Data
@ApiModel(value = "文档下载服务对象")
public class DocumentVO implements Serializable {

    private static final long serialVersionUID = -3684333557455647214L;

    @ApiModelProperty(name = "read_as", value = "读取策略", example = "master_document")
    private String read_as;

    @ApiModelProperty(value = "主文档对象")
    private MasterDocumentVO masterResult;

    @ApiModelProperty(value = "副文档对象")
    private SubDocumentVO subResult;

    public static DocumentVO builder(String readAs, JSONObject object) {
        if(object.containsKey("code")){
            throw new RestException(Integer.valueOf(object.getString("code")),
                    object.getString("message"));
        }
        DocumentVO documentVO = new DocumentVO();
        if(DocumentService.SUB_DOCUMENT.equals(readAs)){
            SubDocumentVO subDocumentVO = SubDocumentVO.builder(object);
            documentVO.setSubResult(subDocumentVO);
        } else if(DocumentService.MASTER_DOCUMENT.equals(readAs) || DocumentService.NO_POLICY.equals(readAs)
                || StrUtil.isBlank(readAs)) {
            MasterDocumentVO masterDocumentVO = MasterDocumentVO.builder(object);
            documentVO.setMasterResult(masterDocumentVO);
        }
        documentVO.setRead_as(readAs);
        return documentVO;
    }
}
