package com.aishu.wf.core.anyshare.client;

import com.aishu.wf.core.common.util.CommonConstants;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

import javax.print.attribute.standard.Media;

/**
 * @description 爱数接口调用
 * @author hanj
 * @version 1.0
 */
@Slf4j
public class ApiClient {

    private static final MediaType MEDIA_JSON = MediaType.get("application/json; charset=utf-8");
    OkHttpClient client;
    String endpoint;

    public ApiClient() {
    }

    public ApiClient(OkHttpClient client, String endpoint) {
        this.client = client;
        this.endpoint = endpoint;
    }

    /**
     * @description 查找指定实体
     * @author hanj
     * @param  url
     * @updateTime 2021/4/30
     */
    String get(String url) throws Exception {
        return this.get(endpoint, url);
    }

    String getWithOriginResp(String url) throws Exception {
        return this.getWithOriginResp(endpoint, url);
    }

    /**
     * @description get请求调用爱数接口
     * @author hanj
     * @param  endpoint,url
     * @updateTime 2021/5/13
     */
    private String get(String endpoint, String url) throws Exception {
        Request request = new Request.Builder().url(endpoint + url).build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 200) {
                return response.body().string();
            } else {
                String errorMsq = String.format("endpoint={%s},url={%s},status={%s},message={%s},body={%s}",
                        endpoint, url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }
    
    private String getWithOriginResp(String endpoint, String url) throws Exception {
        Request request = new Request.Builder().url(endpoint + url).build();
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }

    /**
     * @description 查找指定实体
     * @author yan.nan
     * @param  url
     * @updateTime 2023/6/13
     */
    String getWithToken(String url, String token) throws Exception {
        return this.getWithToken(endpoint, url, token);
    }

     /**
     * @description get请求调用爱数接口携带token
     * @author yan.nan
     * @param  endpoint,url
     * @updateTime 2023/6/13
     */
    private String getWithToken(String endpoint, String url, String token) throws Exception {
        Request request = new Request.Builder().url(endpoint + url).header(CommonConstants.HEADER_AUTHORIZATION, CommonConstants.HEADER_BEARER + token).build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 200) {
                return response.body().string();
            } else {
                String errorMsq = String.format("endpoint={%s},url={%s},status={%s},message={%s},body={%s}",
                        endpoint, url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }

    /**
     * @description 查找指定实体并收集异常消息
     * @author hanj
     * @param  url
     * @updateTime 2021/4/30
     */
    String getAndCollect(String url) throws Exception {
        return this.get(endpoint, url);
    }

    /**
     * @description get请求调用爱数接口并收集异常消息
     * @author hanj
     * @param  endpoint,url
     * @updateTime 2021/5/13
     */
    private String getAndCollect(String endpoint, String url) throws Exception {
        Request request = new Request.Builder().url(endpoint + url).build();
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }

    /**
     * @description 发起新增请求
     * @author hanj
     * @param  url,json,contentType
     * @updateTime 2021/4/30
     */
    String post(String url, String json, MediaType contentType) throws Exception {
        return post(endpoint, url, json, contentType);
    }

    /**
     * @description post请求调用爱数接口
     * @author hanj
     * @param  endpoint,url,json,contentType
     * @updateTime 2021/5/13
     */
    private String post(String endpoint, String url, String json, MediaType contentType) throws Exception {
        Request request;
        RequestBody body = RequestBody.create(contentType != null ? contentType : MEDIA_JSON, json);
        request = new Request.Builder().url(endpoint + url).post(body).build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 204 || response.code() == 201 || response.code() == 200) {
                return response.body().string();
            } else {
                String errorMsq = String.format("endpoint={%s},url={%s},status={%s},message={%s},body={%s}",
                        endpoint, url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }

    Response post(String url, String json) throws Exception {
        return post(endpoint, url, json);
    }

    private Response post(String endpoint, String url, String json) throws IOException {
        Request request;
        RequestBody body = RequestBody.create(json, MEDIA_JSON);
        request = new Request.Builder().url(endpoint + url).post(body).build();
        return client.newCall(request).execute();
    }

    /**
     * @description 发起请求并收集异常消息
     * @author hanj
     * @param  url,json,contentType
     * @updateTime 2021/4/30
     */
    String postAndCollect(String url, String json, MediaType contentType) throws Exception {
        return postAndCollect(endpoint, url, json, contentType);
    }

    /**
     * @description post请求调用爱数接口并收集异常消息
     * @author hanj
     * @param  endpoint,url,json,contentType
     * @updateTime 2021/5/13
     */
    private String postAndCollect(String endpoint, String url, String json, MediaType contentType) throws Exception {
        Request request;
        RequestBody body = RequestBody.create(contentType != null ? contentType : MEDIA_JSON, json);
        request = new Request.Builder().url(endpoint + url).post(body).build();
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }

    /**
     * @description 发起请求附带token并收集异常消息
     * @author hanj
     * @param  url,json,contentType
     * @updateTime 2021/4/30
     */
    String postTokenAndCollect(String url, String json, MediaType contentType,String token) throws Exception {
        return postTokenAndCollect(endpoint, url, json, contentType, token);
    }

    /**
     * @description post请求调用爱数接口附带token并收集异常消息
     * @author hanj
     * @param  endpoint,url,json,contentType
     * @updateTime 2021/5/13
     */
    private String postTokenAndCollect(String endpoint, String url, String json, MediaType contentType,String token) throws Exception {
        Request request;
        RequestBody body = RequestBody.create(contentType != null ? contentType : MEDIA_JSON, json);
        request = new Request.Builder().url(endpoint + url).header(CommonConstants.HEADER_AUTHORIZATION, CommonConstants.HEADER_BEARER + token).post(body).build();
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }

    /**
     * @description 新增或更新请求
     * @author hanj
     * @param  url,json
     * @updateTime 2021/4/30
     */
    String put(String url, String json) throws Exception {
        return this.put(endpoint, url, json);
    }

    /**
     * @description put请求调用爱数接口
     * @author hanj
     * @param  endpoint,url,json
     * @updateTime 2021/5/13
     */
    String put(String endpoint, String url, String json) throws Exception {
        OkHttpClient client = new OkHttpClient();
        RequestBody body = RequestBody.create(MEDIA_JSON, json);
        Request request = new Request.Builder().url(endpoint + url).put(body).build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 201 || response.code() == 200 || response.code() == 204) {
                return response.body().string();
            } else {
                String errorMsq = String.format("endpoint={%s},url={%s},status={%s},message={%s},body={%s}",
                        endpoint, url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }

    /**
     * @description 发起更新请求
     * @author hanj
     * @param  url,json
     * @updateTime 2021/4/30
     */
    String patch(String url, String json) throws Exception {
        return patch(endpoint, url, json);
    }

    /**
     * @description patch请求调用爱数接口
     * @author hanj
     * @param  endpoint,url,json
     * @updateTime 2021/5/13
     */
    private String patch(String endpoint, String url, String json) throws Exception {
        RequestBody body = RequestBody.create(MEDIA_JSON, json);
        Request request = new Request.Builder().url(endpoint + url).patch(body)
                .build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 200) {
                return response.body().string();
            } else {
                String errorMsq = String.format("endpoint={%s},url={%s},status={%s},message={%s},body={%s}",
                        endpoint, url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }

    /**
     * @description 发起删除请求
     * @author hanj
     * @param  url
     * @updateTime 2021/4/30
     */
    boolean delete(String url) throws Exception {
        return delete(endpoint, url);
    }

    /**
     * @description delete请求调用爱数接口
     * @author hanj
     * @param  endpoint,url
     * @updateTime 2021/5/13
     */
    private boolean delete(String endpoint, String url) throws Exception {
        Request request = new Request.Builder().url(endpoint + url).delete().build();
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 204) {
                return true;
            } else {
                String errorMsq = String.format("endpoint={%s},url={%s},status={%s},message={%s},body={%s}",
                        endpoint, url, response.code(), response.message(), response.body().string());
                throw new Exception(errorMsq);
            }
        }
    }

    public void close() {
        ConnectionPool connectionPool = client.connectionPool();
        Dispatcher dispatcher = client.dispatcher();
        ExecutorService executorService = client.dispatcher() != null ? client.dispatcher().executorService() : null;

        if (dispatcher != null) {
            dispatcher.cancelAll();
        }
        if (connectionPool != null) {
            connectionPool.evictAll();
        }
        shutdownExecutorService(executorService);
    }

    boolean shutdownExecutorService(ExecutorService executorService) {
        if (executorService == null) {
            return false;
        }
        // If it hasn't already shutdown, do shutdown.
        if (!executorService.isShutdown()) {
            executorService.shutdown();
        }

        try {
            // Wait for clean termination
            if (executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                return true;
            }

            // If not already terminated (via shutdownNow) do shutdownNow.
            if (!executorService.isTerminated()) {
                executorService.shutdownNow();
            }

            if (executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                return true;
            }

            if (log.isDebugEnabled()) {
                List<Runnable> tasks = executorService.shutdownNow();
                if (!tasks.isEmpty()) {
                    log.debug(
                            "ExecutorService was not cleanly shutdown, after waiting for 10 seconds. Number of remaining tasks: {}",
                            tasks.size());
                }
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            // Preserve interrupted status
            Thread.currentThread().interrupt();
        }
        return false;
    }
}
