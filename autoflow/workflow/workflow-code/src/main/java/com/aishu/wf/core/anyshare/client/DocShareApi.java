package com.aishu.wf.core.anyshare.client;

import java.net.URLEncoder;
import java.util.List;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import okhttp3.MediaType;

public class DocShareApi {
    private static final String READ_POLICY = "/api/read-policy/v2/doc-config";

    private static final String DOC_OWNER = "/api/doc-share/v1/doc-owners/";

    private static final String DOC_PERM = "/api/doc-share/v1/doc-perm";

    private static final String CHECK_DOC_PERM = "/api/eacp/v1/perm1/check";

    private final ApiClient apiClient;

    public DocShareApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * @description 获取文档的读取策略
     * @author hanj
     * @param postData postData
     * @updateTime 2021/7/19
     */
    public JSONObject readPolicy(String queryString, String token) throws Exception {
        String body = apiClient.getWithToken(READ_POLICY + queryString, token);
        JSONObject object = JSON.parseObject(body);
        return object;
    }

    public JSONArray getOwnerList(String docID) throws Exception {
        String encodedDocID = URLEncoder.encode(docID, "UTF-8");
        String body = apiClient.get(DOC_OWNER+encodedDocID);
        JSONArray owners = JSONArray.parseArray(body);
        return owners;
    }

    public void setDocPerm(String docID, List<JSONObject> data) throws Exception {
        JSONObject payload = new JSONObject();
        payload.put("doc_id", docID);
        payload.put("configs", data);
        MediaType mediaType = MediaType.get("application/json");
        apiClient.post(DOC_PERM, payload.toString(), mediaType);
    }

    
    /**
     * @description 检查文档权限
     * @author siyu.chen
     * @param  docId 文档ID
     * @param  opts 操作类型
     * @updateTime 2024/3/21
     */
    public JSONObject checkPerm(String docId, String opt, String token) throws Exception {
        MediaType mediaType = MediaType.get("application/json");
        JSONObject payload = new JSONObject();
        payload.put("perm", opt);
        payload.put("docid", docId);
        String body = apiClient.postTokenAndCollect(CHECK_DOC_PERM, payload.toJSONString(), mediaType, token);
        JSONObject object = JSON.parseObject(body);
        return object;
    }
}
