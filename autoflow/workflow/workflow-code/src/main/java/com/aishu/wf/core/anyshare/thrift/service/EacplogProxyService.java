package com.aishu.wf.core.anyshare.thrift.service;

import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.engine.util.JsonUtil;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @description EacpLog的代理类，先保存至NSQ，再调用EacpLog记录日志
 * @author lw
 */
@Slf4j
@Service
public class EacplogProxyService {

	@Autowired
	NsqSenderService nsqSenderService;

	/**
	 * 保存EacpLog
	 * 
	 * @param sysLog
	 */
	public void saveEacpLog(OperationLogDTO sysLog) {
		String jsonMsg = JsonUtil.convertToJson(sysLog);
		if (sysLog.getLogType().equals(ncTLogType.NCT_LT_OPEARTION)) {
			log.debug("保存日志至NSQ WORKFLOW_AUDIT_OPERATION_LOG", jsonMsg);
			nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_OPERATION_LOG, jsonMsg);
		} else{
			log.debug("保存日志至NSQ WORKFLOW_AUDIT_MANAGEMENT_LOG", jsonMsg);
			nsqSenderService.sendMessage(NsqConstants.WORKFLOW_AUDIT_MANAGEMENT_LOG, jsonMsg);
		}
	}

}
