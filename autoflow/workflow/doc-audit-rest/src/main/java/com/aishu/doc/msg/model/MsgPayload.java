package com.aishu.doc.msg.model;

import com.aishu.wf.core.anyshare.model.User;
import com.alibaba.fastjson.annotation.JSONField;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * @description 消息发送请求参数对象
 * @author hanj
 */
@Data
@Builder
public class MsgPayload {
    @JSONField(name = "payload")
    private MsgContent content;

    private String channel;

    private List<User> receivers;

}
