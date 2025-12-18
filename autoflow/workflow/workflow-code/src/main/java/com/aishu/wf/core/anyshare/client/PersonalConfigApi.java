package com.aishu.wf.core.anyshare.client;

import okhttp3.MediaType;

public class PersonalConfigApi {
    private static final String DEPLOYMENT_SERVICE = "/api/personal-config/v1/deployment/service";

    private final ApiClient apiClient;

    public PersonalConfigApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public String registModuleService(String postData) throws Exception {
        MediaType mediaType = MediaType.get("application/json");
        return apiClient.postAndCollect(DEPLOYMENT_SERVICE, postData, mediaType);
    }
}
