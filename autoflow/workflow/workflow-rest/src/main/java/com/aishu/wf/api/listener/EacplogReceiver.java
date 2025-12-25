package com.aishu.wf.api.listener;

import javax.annotation.Resource;

import com.alibaba.fastjson.JSON;
import org.springframework.stereotype.Component;

import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.thrift.service.EacplogThriftService;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.engine.util.JsonUtil;
import com.aishu.wf.core.thrift.eacplog.ncTLogItem;
import aishu.cn.msq.MessageHandler;

import cn.hutool.core.bean.BeanUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 接收Eacplog的NSQ消息，并调用Eacplog服务记录日志
 * @author lw
 */
@Slf4j
// 由nsq发送消息实现，由eacplog服务发送日志方式废弃
// @Component(value = NsqConstants.WORKFLOW_EACP_LOG)
public class EacplogReceiver implements MessageHandler {

    @Resource
    private EacplogThriftService eacplogThriftService;

    /**
     * @description 接收Eacplog的NSQ消息，并调用Eacplog记录日志
     * @author lw
     * @param  handler
     * @updateTime 2021/5/28
     */
    @Override
    public void handler(String msg) {
        if (log.isDebugEnabled()) {
            log.debug("接收Eacp日志处理类正在处理...");
        }
        OperationLogDTO operationLogDTO=new OperationLogDTO();
        try {
        	operationLogDTO=(OperationLogDTO) JsonUtil.convertToBean(msg,OperationLogDTO.class);
        	ncTLogItem logItem = new ncTLogItem();
            BeanUtil.copyProperties(operationLogDTO, logItem);
            if (log.isDebugEnabled()) {
            	log.debug("接收Eacp日志保存日志:{}", JSON.toJSONString(logItem));
            }
            eacplogThriftService.saveEacpLog(logItem);
        } catch (Exception e) {
            log.error("接收Eacp日志处理失败！obj:", operationLogDTO, e);
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.WORKFLOW_EACP_LOG, e, msg);
            throw e;
        }finally{
        }
    }
}
