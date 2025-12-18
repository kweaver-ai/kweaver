package com.aishu.doc.monitor;

import java.util.List;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.apache.commons.lang3.StringUtils;

import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.alibaba.fastjson.JSONObject;
import aishu.cn.msq.MessageHandler;

import lombok.extern.slf4j.Slf4j;

/**
 * @description 文件夹移动消息监听类
 * 文档移动作废流程屏蔽，只需监听取消申请nsq作废流程
 * @author Liuchu
 */
@Slf4j
// @Component(value = NsqConstants.CORE_FOLDER_MOVE)
public class FolderMoveReceiver implements MessageHandler {

    @Resource
    private ProcessInstanceService processInstanceService;

	@Resource
	private DocAuditSubmitService docAuditSubmitService;

    /**
     * 流程作废原因
     */
    private static final String CANCEL_REASON="doc_move";
	/**
	 * 操作用户-管理员（固定id）
	 */
	private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

	/**
	 * @description 接收NSQ消息
	 * @author ouandyang
	 * @param handler
	 * @updateTime 2021/5/13
	 */
	@Override
	public void handler(String msg) {
		if (log.isDebugEnabled()) {
			log.debug("文件夹移动消息监听类正在处理...");
		}
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject jsonObject = JSONObject.parseObject(msg);
			String id = jsonObject.getString("id");
			if (StringUtils.isEmpty(id)) {
				return;
			}
			// 根据文件ID获取所有的流程实例id
			List<ProcessInstanceModel> list = processInstanceService.getProcessInstancesByBizKey(id);
			if(list.isEmpty()){
				return;
			}
			List<String> procInstIds = list.stream().map(ProcessInstanceModel::getProcInstId).distinct()
					.collect(Collectors.toList());
			//流程作废，更新业务数据
			docAuditSubmitService.batchCancel(procInstIds, USER_ADMIN, CANCEL_REASON);
		} catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_FOLDER_REMOVE, e, msg);
			log.warn("文件夹移动消息监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
}
