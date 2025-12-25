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
public class MsgObject {

    /**
     * 申请者
     */
    public final static String RECEIVE_TYPE_APPLICANT = "applicant";
    /**
     * 访问者
     */
    public final static String RECEIVE_TYPE_VISITOR = "visitor";
    /**
     * 审核员
     */
    public final static String RECEIVE_TYPE_AUDITOR = "auditor";
    /**
     * 申请者消息类型key
     */
    public final static String _TO_APPLICANT_ = "_to_applicant_";
    /**
     * 申请者消息退回类型key
     */
    public final static String _TO_APPLICANT_SENDBACK = "_to_applicant_sendback";
    /**
     * 访问者消息类型key
     */
    public final static String _TO_VISITOR_ = "_to_visitor_";
    /**
     * 审核员消息类型key
     */
    public final static String _TO_AUDITOR_ = "_to_auditor_";

    @JSONField(name = "payload")
    private MsgContent content;

    private String channel;

    private List<User> receivers;

}
