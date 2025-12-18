package com.aishu.wf.core.anyshare.client;

import cn.hutool.core.text.UnicodeUtil;
import cn.hutool.core.util.URLUtil;

import com.aishu.wf.core.common.exception.RestException;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;

/**
 * @description efast内部调用操作
 * @author hanj
 */
public class EfastApi {

    private static final String OS_DOWNLOAD = "/api/efast/v1/file/osdownload";
    private static final String DIR_LIST = "/api/efast/v1/dir/list";
    private static final String DOC_INFO = "/api/efast/v1/items/%s/path,type";
    private static final String BATCH_DOC_INFO = "/api/efast/v1/items-batch/%s";

    private final ApiClient apiClient;

    public EfastApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public JSONObject osdownload(String postData) throws Exception {
        MediaType mediaType = MediaType.get("application/json");
        String body = apiClient.postAndCollect(OS_DOWNLOAD, postData, mediaType);
        JSONObject object = JSON.parseObject(body);
        return object;
    }

    public String dirList(String postData) throws Exception {
        MediaType mediaType = MediaType.get("application/json");
        return apiClient.postAndCollect(DIR_LIST, postData, mediaType);
    }

    /**
     * @description 获取文档信息
     * @author ouandyang
     * @param  id 文档ID
     * @updateTime 2021/8/9
     */
    public String docInfo(String id) throws Exception {
        return apiClient.get(String.format(DOC_INFO, URLEncoder.encode(id, "utf-8")));
    }

    public JSONArray batchGetDocInfo(List<String> docIds, List<String> attrs) throws Exception{
        MediaType mediaType = MediaType.get("application/json");
        JSONObject payload = new JSONObject();
        payload.put("method", "GET");
        payload.put("ids", docIds);
        String body = apiClient.postAndCollect(String.format(BATCH_DOC_INFO, String.join(",", attrs)), payload.toJSONString(), mediaType);
        try {
            return JSON.parseArray(body);
        } catch (Exception e) {
            JSONObject object = JSON.parseObject(body);
            if (object.getInteger("code") != null) {
                throw new RestException(object.getInteger("code"), object.getString("message"), object.getString("detail"));
            }
        }
        return new JSONArray();
    }
}
