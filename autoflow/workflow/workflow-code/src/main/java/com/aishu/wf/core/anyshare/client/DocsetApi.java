package com.aishu.wf.core.anyshare.client;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;

/**
 * @description docset内部调用操作
 * @author hanj
 */
public class DocsetApi {

    private static final String DOWNLOAD = "/api/docset/v1/item/";

    private final ApiClient apiClient;

    public DocsetApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public JSONObject docsetDownload(String docId,String version, String token) throws Exception {
        MediaType mediaType = MediaType.get("application/json");
        System.out.println("获取副文档下载地址：docId" + docId + "=======token=====" + token);
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("version",version);
        String body = apiClient.postTokenAndCollect(DOWNLOAD + docId, jsonObject.toJSONString(), mediaType, token);
        JSONObject object = JSON.parseObject(body);
        return object;
    }
}
