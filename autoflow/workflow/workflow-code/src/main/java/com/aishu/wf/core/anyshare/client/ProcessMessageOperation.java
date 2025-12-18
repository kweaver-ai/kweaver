package com.aishu.wf.core.anyshare.client;

import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.Response;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.alibaba.fastjson.JSON;

import cn.hutool.core.util.StrUtil;

/**
 * @description 流程消息操作
 * @author hanj
 * @version 1.0
 */
@Slf4j
public class ProcessMessageOperation {

    private static final String SEND_MESSAGE = "/api/message/v1/notifications";

    private static final String SEND_TODO_MESSAGE = "/api/message/v1/to-do-list";
    private static final String UPDATE_TODO_MESSAGE_RECEIVER_HANDLER = "/api/message/v1/to-do-list/%s/receivers/%s/handler_id";
    private static final String UPDATE_TODO_MESSAGE = "/api/message/v1/to-do-list/%s/%s";

    private final ApiClient eacpApiClient;
    private final ApiClient messageApiClient;

    public ProcessMessageOperation(ApiClient eacpApiClient, ApiClient messageApiClient) {
        this.eacpApiClient = eacpApiClient;
        this.messageApiClient = messageApiClient;
    }

    /**
     * @description 发送流程消息
     * @author hanj
     * @param postData 消息内容（json格式）
     * @updateTime 2021/4/30
     */
    public void sendMessage(String postData) throws Exception {
        try {
            MediaType mediaType = MediaType.get("application/json");
            messageApiClient.post(SEND_MESSAGE, postData, mediaType);
        } catch (Exception e) {
            log.warn("sendMessage, error: {}", e);
            throw e;
        }
    }

    /**
     * @description 发送待办消息
     * @param postData
     * @return
     * @throws Exception
     */
    public List<String> sendTodoMessage(String postData) throws Exception {

        Response response = messageApiClient.post(SEND_TODO_MESSAGE, postData);
        if (response.code() == 201) {
            String location = response.header("Location");
            String[] paths = location.split("/");
            if (paths.length > 0) {
                String[] ids = paths[paths.length - 1].split(",");
                return Arrays.asList(ids);
            }
        }

        String errorMsq = String.format("url={%s},status={%s},message={%s},body={%s},headers={%s}",
                SEND_TODO_MESSAGE, response.code(), response.message(), response.body().string(), response.headers().toString());

        log.warn("sendTodoMessage, error: {}", errorMsq);
        throw new Exception(errorMsq);
    }

    /**
     * @description 更新待办消息处理人
     * @param messageId
     * @param receivers
     * @param handlerId
     * @throws Exception
     */
    public void updateTodoMessageReceiverHandler(String messageId, List<String> receivers, String handlerId)
            throws Exception {
        try {
            Map<String, String> map = new HashMap<>();
            map.put("handler_id", handlerId);
            messageApiClient.put(
                    String.format(UPDATE_TODO_MESSAGE_RECEIVER_HANDLER, messageId, String.join(",", receivers)),
                    JSON.toJSONString(map));
        } catch (Exception e) {
            log.warn("updateTodoMessageReceiverHandler, error: {}", e);
            throw e;
        }
    }

    /**
     * @description 更新待办消息
     * @param messageId
     * @param handlerId
     * @param content
     * @throws Exception
     */
    public void updateTodoMessage(String messageId, String handlerId, Object content) throws Exception {
        Map<String, Object> map = new HashMap<>();
        if (!StrUtil.isEmpty(handlerId)) {
            map.put("handler_id", handlerId);
        }
        if (content != null) {
            map.put("payload", content);
        }

        if (map.isEmpty()) {
            return;
        }

        try {
            messageApiClient.put(String.format(UPDATE_TODO_MESSAGE, messageId, String.join(",", map.keySet())),
                    JSON.toJSONString(map));
        } catch (Exception e) {
            log.warn("updateTodoMessage, error: {}", e);
            throw e;
        }
    }
}
