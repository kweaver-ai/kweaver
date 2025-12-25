package com.aishu.wf.core.anyshare.client;

import com.aishu.wf.core.common.util.StringUtils;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * @description deploy-service内部调用操作
 * @author ouandyang
 */
public class DeployServiceApi {

    private static final String ACCESS_ADDR_URL = "/api/deploy-manager/v1/access-addr/app";

    private final ApiClient apiClient;

    public DeployServiceApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public JSONObject getAccessAddr() throws Exception {
        String body = apiClient.get(ACCESS_ADDR_URL);
        JSONObject bodyObj = JSON.parseObject(body);
        if (bodyObj.containsKey("host") && StringUtils.isIPv6(bodyObj.getString("host")) && !bodyObj.getString("host").contains("[")){
            bodyObj.put("host", String.format("[%s]",bodyObj.getString("host")));
        }
        return bodyObj;
    }
}
