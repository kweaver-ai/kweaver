
package com.aishu.wf.core.anyshare.client;


import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 获取
 * @author xiashenghui
 */
@Slf4j
public class AppstoreClient {

	private static final String APPLIST_URL = "/api/appstore/v1/applist";

	private final ApiClient apiClient;

	public AppstoreClient(ApiClient apiClient) {
		this.apiClient = apiClient;
	}


	public JSONObject getApplist() throws Exception {
		String body = apiClient.get(APPLIST_URL);
		return JSON.parseObject(body);
	}
}
