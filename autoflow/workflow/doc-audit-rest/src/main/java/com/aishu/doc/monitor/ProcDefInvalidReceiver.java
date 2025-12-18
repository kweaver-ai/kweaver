package com.aishu.doc.monitor;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONException;
import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.doc.audit.model.DocAuditApplyModel;
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
 * @description 流程定义失效NSQ
 * @author ouandyang
 */
@Slf4j
@Component(value = NsqConstants.CORE_PROC_DEF_INVALID)
public class ProcDefInvalidReceiver extends BaseRest implements MessageHandler {

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
			log.debug("流程定义失效事件监听类正在处理...");
		}
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject json = JSONUtil.parseObj(msg);
			String type = json.getStr("type");
			if("delete".equals(type)){
				JSONArray keys = json.getJSONArray("proc_def_keys");
				List<String> list = JSONUtil.toList(keys, String.class);
				for (String str : list) {
					List<DocAuditApplyModel> applyList = docAuditApplyService.selectByProcDefKey(str);
					for (DocAuditApplyModel docAuditApplyModel : applyList) {
						if(DocConstants.BIZ_TYPE_FLOW.equals(docAuditApplyModel.getApplyType())){
//							docAuditSubmitService.revocationByApplyId(docAuditApplyModel.getBizId(), "844342e2-c5d2-11ec-acfb-66690d22c644", DocConstants.PROC_FLOW_DEF_DELETE);
							docAuditSubmitService.revocationByApplyId(docAuditApplyModel.getBizId(),json.getStr("userId"), DocConstants.PROC_FLOW_DEF_DELETE);
						}else{
							docAuditSubmitService.revocationByApplyId(docAuditApplyModel.getBizId(), USER_ADMIN, DocConstants.DELETE_REASON_PROC_DEF_DELETE);
						}
					}
				}
			}
		} catch(JSONException e) {
			log.warn("流程定义失效事件监听类处理失败, json解析失败！msg：{}", msg, e);
		} catch (NullPointerException e) {
            log.warn("流程定义失效事件监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_PROC_DEF_INVALID, e, msg);
			log.warn("流程定义失效事件监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
}
