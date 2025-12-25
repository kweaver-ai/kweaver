package com.aishu.wf.core.anyshare.client;

import java.net.URLEncoder;

/**
 * @description 文档服务
 * @author ouandyang
 */
public class DocumentApi {

    private static final String DOC_LIB_TYPE = "/api/document/v1/items/%s/doc_lib";

    private final ApiClient apiClient;

    public DocumentApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * @description 根据文档库ID获取文档库类型
     * @author ouandyang
     * @param  docLibId 文档库ID
     * @updateTime 2021/9/6
     */
    public String docLibInfo(String docLibId) throws Exception {
        return apiClient.get(String.format(DOC_LIB_TYPE, URLEncoder.encode(docLibId, "utf-8")));
    }

}
