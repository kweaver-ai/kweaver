package com.aishu.doc.monitor;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.common.DocConstants;

import aishu.cn.msq.MessageHandler;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * @description 流程定义修改NSQ
 * @author ouandyang
 */
@Slf4j
@Component(value = NsqConstants.CORE_PROC_DEF_MODIFY)
public class ProcDefModifyReceiver extends BaseRest implements MessageHandler {

	@Resource
	private DocAuditApplyService docAuditApplyService;
	@Resource
	private DocAuditSubmitService docAuditSubmitService;

	/**
	 * 操作用户-管理员（固定id）
	 */
	private static final String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";

	@Override
	public void handler(String msg) {
		if (log.isDebugEnabled()) {
			log.debug("流程定义修改事件监听类正在处理...");
		}
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject json = JSONUtil.parseObj(msg);
			String procDefId = json.getStr("proc_def_id");
            if (StrUtil.isEmpty(procDefId)) {
                return;
            }

            // 获取当前流程下绑定的所有实例ID
            List<String> procInstIds = docAuditApplyService.selectProcInstIDListByProcDefID(procDefId);
			// 防止nsq消息消费超市，重试出错
            if (CollUtil.isEmpty(procInstIds)) {
				return;
            }
			//申请撤销，更新业务数据
            docAuditSubmitService.batchCancel(procInstIds, USER_ADMIN, DocConstants.PROC_DEF_BROKEN);
		} catch(JSONException e) {
			log.warn("流程定义修改事件监听类处理失败, json解析失败！msg：{}", msg, e);
		} catch (NullPointerException e) {
            log.warn("流程定义修改事件监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_PROC_DEF_INVALID, e, msg);
			log.warn("流程定义修改事件监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
}
