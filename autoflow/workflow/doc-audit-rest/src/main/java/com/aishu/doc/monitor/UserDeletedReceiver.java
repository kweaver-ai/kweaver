package com.aishu.doc.monitor;

import cn.hutool.core.collection.CollUtil;
import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.service.DocShareStrategyAuditorService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONException;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * @description 用户删除事件监听类
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.CORE_USER_DELETE)
public class UserDeletedReceiver implements MessageHandler {

    @Resource
    private ProcessInstanceService processInstanceService;

	@Resource
	private ProcessDefinitionService processDefinitionService;

	@Resource
	private DocShareStrategyAuditorService docShareStrategyAuditorService;

	@Resource
	private DocShareStrategyService docShareStrategyService;

	@Resource
	private DocAuditApplyService docAuditApplyService;

	@Resource
	private DocAuditHistoryService docAuditHistoryService;

	@Resource
	private DocAuditSubmitService docAuditSubmitService;

    /**
     * 流程作废原因,用户被删除了
     */
    private static final String CANCEL_REASON = "user_deleted";
	/**
	 * 操作用户-管理员（固定id）
	 */
	private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

	/**
	 * @description 用户删除，1.删除待办任务或作废流程 2.同步删除审核策略的审核员 3.删除其个人文档库配的审核策略
	 * @author hanj
	 * @param handler handler
	 * @updateTime 2021/6/21
	 */
	@Override
	public void handler(String msg) {
		if (log.isDebugEnabled()) {
			log.debug("用户删除事件监听类正在处理...");
		}
		String userId = null;
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject jsonObject = JSONObject.parseObject(msg);
			userId = jsonObject.getString("id");
			if (StringUtils.isEmpty(userId)) {
				return;
			}
			List<String> procInstIds = processInstanceService.deleteAllTaskByUserId(userId, CANCEL_REASON);
			//流程作废，更新业务数据
			if(CollUtil.isNotEmpty(procInstIds)){
				docAuditSubmitService.batchCancel(procInstIds, USER_ADMIN, CANCEL_REASON);
			}

			//用户删除，审核策略的审核员同步删除
			docShareStrategyAuditorService.deleteAuditorByUserDeleted(userId);

			//用户删除，删除其个人文档库配的审核策略
			docShareStrategyService.deleteDocShareStrategyByDocId(userId);

			// 删除业务数据审核员
			docAuditApplyService.deleteUserForAuditor(userId);
		} catch(JSONException e) {
			log.warn("用户删除事件监听类处理失败, json解析失败！msg：{}", msg, e);
		} catch (NullPointerException e) {
            log.warn("用户删除事件监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_USER_DELETE, e, msg);
			log.warn("用户删除事件监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
}
