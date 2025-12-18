package com.aishu.wf.core.anyshare.nsq;

import cn.hutool.core.util.IdUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.OutBoxModel;
import com.aishu.wf.core.doc.service.OutBoxService;

import aishu.cn.msq.ProtonMQClient;
import com.aishu.wf.core.anyshare.config.NsqConfig;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

import java.util.Date;
import java.util.List;

/**
 * @description NSQ发送端
 * @author ouandyang
 */
@Slf4j
@Component("NsqSenderService")
public class NsqSenderService {

    @Resource
    private NsqConfig nsqConfig;
    @Autowired
    private OutBoxService outBoxService;


    private MsqClient instance;
    private ProtonMQClient mqClient;

    @PostConstruct
    private void init() {
        // GenericKeyedObjectPoolConfig  poolConfig = new GenericKeyedObjectPoolConfig();
        // poolConfig.setTestOnBorrow(true);
        // poolConfig.setJmxEnabled(false);
        // poolConfig.setMaxTotalPerKey(20);
        // poolConfig.setMinIdlePerKey(3);
        log.debug("nsq发送端启动中！============> nsqHost:{}, nsqPort:{}", nsqConfig.getProduceHost(), nsqConfig.getProducePort());
        // this.nsqProducer = new NSQProducer().addAddress(nsqHost, nsqPort);
        // nsqProducer.setPoolConfig(poolConfig);
        // nsqProducer.start();
        instance = MsqClient.getMsqClient(nsqConfig);
        mqClient = instance.getProtonMQClient();
        log.debug("nsq发送端启动成功。============> nsqHost:{}, nsqPort:{}", nsqConfig.getProduceHost(), nsqConfig.getProducePort());

        // nsq启动后，发送一条无用nsq（一个topic如果有多个channel消费，那么这个topic的第一个消息，会存在不是所有channel都能消费到的问题）
        // nsqSenderService.sendMessage(NsqConstants.CORE_PROC_DEF_INVALID, "{}");
        try {
            mqClient.pub(NsqConstants.CORE_PROC_DEF_INVALID, "{}");
        } catch (Exception e) {
            System.out.println(e);
            log.warn("nsq 测试发送消息失败， err:{}", e);
        }
    }

    /**
     *
     * @return ProtonMQClient 返回一个新的发送端实例
     */
    // public ProtonMQClient getProducer() {
    //     return mqClient;
    // }

    /**
     * 发送消息
     * @param topic 消息队列的topic
     * @param message 消息
     */
    public void sendMessage(String topic,JSONObject message) {
        try {
            mqClient.pub(topic, message.toStringPretty());
            if (log.isDebugEnabled()) {
                log.debug("nsq===发送消息成功！msg:{}", message.toStringPretty());
            }
        }catch (Exception e) {
            log.warn("nsq===发送消息异常！", e);
            OutBoxModel outbox = OutBoxModel.builder().id(IdUtil.randomUUID()).topic(topic).message(message.toString()).createTime(new Date()).build();
            outBoxService.addOutBoxMessage(outbox);
        }
    }

    /**
     * 发送消息
     * @param topic 消息队列的topic
     * @param message 消息
     */
    public void sendMessage(String topic,String message) {
        try {
            mqClient.pub(topic, message);
            if (log.isDebugEnabled()) {
                log.debug("nsq===发送消息成功！msg:{}", message);
            }
        }catch (Exception e) {
            log.warn("nsq===发送消息异常！", e);
            OutBoxModel outbox = OutBoxModel.builder().id(IdUtil.randomUUID()).topic(topic).message(message).createTime(new Date()).build();
            outBoxService.addOutBoxMessage(outbox);
        }
    }

    /**
     * 发送审核通知
     *
     * @param topic   话题
     * @param applyid 申请ID
     * @param result  审核结果
     */
    public void sendAuditNotify(String topic, String applyid, boolean result) {
        if(StringUtils.isEmpty(topic) || StringUtils.isEmpty(applyid)) {
            log.warn("sendAuditNotify params error");
        }
        JSONObject json = JSONUtil.createObj().set("apply_id", applyid).set("result", result);
        this.sendMessage(topic, json);

    }

    /**
     * 发送审核通知
     *
     * @param topic   话题
     * @param applyid 申请ID
     * @param result  审核结果
     */
    public void sendAuditNotify(String topic, String applyid, String result, List<String> assigneeList) {
        if(StringUtils.isEmpty(topic) || StringUtils.isEmpty(applyid)) {
            log.warn("sendAuditNotify params error");
        }
        JSONObject json = JSONUtil.createObj().set("apply_id", applyid).set("result", result).set("finally_auditor_ids", assigneeList);
        this.sendMessage(topic, json);
    }




    public String getTopic(String bizType) {
        if (DocConstants.BIZ_TYPE_REALNAME_SHARE.equals(bizType)) {
            return NsqConstants.CORE_AUDIT_SHARE_REALNAME_NOTIFY;
        } else if (DocConstants.BIZ_TYPE_ANONYMITY_SHARE.equals(bizType)) {
            return NsqConstants.CORE_AUDIT_SHARE_ANONYMOUS_NOTIFY;
        }
        throw new RestException("不支持的NSQ主题");
    }

    public void sendMessageRetry(String topic,JSONObject message) throws Exception{
        mqClient.pub(topic, message.toStringPretty());
        if (log.isDebugEnabled()) {
            log.debug("nsqretry===发送消息成功！msg:{}", message.toStringPretty());
        }
    }

}