package com.aishu.doc.audit.model.dto;

import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.Map;

@ApiModel(value = "文件下载服务参数对象")
@Data
public class DocumentDTO {

    @ApiModelProperty(value = "流程实例id", example = "17b3e670-beeb-11eb-aa79-00ff18ab8db3", required = true)
    @NotBlank(message = "流程实例id不能为空")
    private String proc_inst_id;

    @ApiModelProperty(value = "类型，apply表示我的申请 task表示我的待办", example = "apply", required = true)
    @NotBlank(message = "类型不能为空")
    private String type;

    @ApiModelProperty(value = "读取方式，online表示在线 download表示下载", example = "download", required = true)
    @NotBlank(message = "读取方式")
    private String read_restriction;

    @ApiModelProperty(value = "文档库类型，user_doc_lib表示个人文档库 department_doc_lib表示部门文档库 custom_doc_lib表示自定义文档库 knowledge_doc_lib表示知识库", example = "user_doc_lib", required = true)
    @NotBlank(message = "文档库类型不能为空")
    private String doc_lib_type;

    @ApiModelProperty(value = "文档id", example = "gns://337CF682A29B4B4AAE37947BE99E817B/FD6C37F52BE446FEA563D0A117DC487F", required = true)
    @NotBlank(message = "文档id不能为空")
    private String doc_id;

    @ApiModelProperty(value = "文档版本", example = "23CFDFB9D3AC444BB129B6230C33A772")
    private String rev;

    @ApiModelProperty(value = "id", example = "23CFDFB9D3AC444BB129B6230C33A772")
    private String id;

    @Data
    static class DownloadRequest {

        private String docid;

        private String authtype;

        private boolean usehttps;

        private boolean external_request;

        private String rev;

    }

    public static DownloadRequest builder(DocumentDTO documentDTO) {
        DownloadRequest downloadRequest = new DownloadRequest();
        downloadRequest.setDocid(documentDTO.getDoc_id());
        downloadRequest.setAuthtype("QUERY_STRING");
        downloadRequest.setUsehttps(true);
        downloadRequest.setExternal_request(true);
        downloadRequest.setRev(documentDTO.getRev());
        return downloadRequest;
    }

    public static Map<String, Object> builderPolicy(DocumentDTO documentDTO) {
        Map<String, Object> inputMap = Maps.newHashMap();
        String docLibType = documentDTO.getDoc_lib_type();
        inputMap.put("doc_id", documentDTO.getDoc_id());
        inputMap.put("doc_lib_type", docLibType.substring(0, docLibType.indexOf("_")));
        inputMap.put("accessed_by","accessed_by_users");
        inputMap.put("read_restriction", documentDTO.getRead_restriction());
        return inputMap;
    }

}
