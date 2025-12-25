package com.aishu.doc.monitor;

import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.service.DocShareStrategyAuditorService;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONException;
import aishu.cn.msq.MessageHandler;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * @description 组织机构成员名称变更（用户，部门，联系人组）事件监听类
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.CORE_ORG_NAME_MODIFY)
public class OrgNameModifyReceiver implements MessageHandler {

	@Resource
	private DocShareStrategyAuditorService docShareStrategyAuditorService;

	@Resource
	private DocAuditApplyService docAuditApplyService;

	/**
	 * @description 组织机构成员名称变更（用户，部门，联系人组）
	 * @author hanj
	 * @param handler handler
	 * @updateTime 2021/6/21
	 */
	@Override
	public void handler(String msg) {
		if (log.isDebugEnabled()) {
			log.debug("组织机构成员名称变更（用户，部门，联系人组）事件监听类正在处理...");
		}
		String userId = null;
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject jsonObject = JSONObject.parseObject(msg);
			userId = jsonObject.getString("id");
			String type = jsonObject.getString("type");
			String new_name = jsonObject.getString("new_name");
			if (StringUtils.isEmpty(userId) || !"user".equals(type)) {
				return;
			}
			//用户名称变更，审核策略的审核员名称同步变更
			docShareStrategyAuditorService.updateAuditorNameByUserNameModify(userId, new_name);

			// 用户名称变更，审核申请表与审核申请历史表发起人同步变更
			docAuditApplyService.updateApplyUserByUserNameModify(userId, new_name);
		} catch(JSONException e) {
			log.warn("组织机构成员名称变更（用户，部门，联系人组）事件监听类处理失败, json解析失败！msg：{}", msg, e);
		} catch (NullPointerException e) {
            log.warn("组织机构成员名称变更（用户，部门，联系人组）事件监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_ORG_NAME_MODIFY, e, msg);
			log.warn("组织机构成员名称变更（用户，部门，联系人组）事件监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
}
