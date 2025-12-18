package com.aishu.doc.monitor;

import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.service.DocShareStrategyAuditorService;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONException;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * @description 文档库删除消息监听类
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.CORE_DOCLIB_REMOVE)
public class DocLibRemoveReceiver implements MessageHandler {

	@Resource
	private DocShareStrategyAuditorService docShareStrategyAuditorService;

	@Resource
	private DocShareStrategyService docShareStrategyService;

	/**
	 * @description 文档库删除同步删除审核策略
	 * @author hanj
	 * @param handler handler
	 * @updateTime 2021/6/21
	 */
	@Override
	public void handler(String msg) {
		if (log.isDebugEnabled()) {
			log.debug("文档库删除消息监听类正在处理...");
		}
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject jsonObject = JSONObject.parseObject(msg);
			String docId = jsonObject.getString("id");
			if (StringUtils.isEmpty(docId)) {
				return;
			}
			//删除该文档库的审核策略
			docShareStrategyService.deleteDocShareStrategyByDocId(docId);
		} catch(JSONException e) {
			log.warn("文档库删除消息监听类处理失败, json解析失败！msg：{}", msg, e);
		} catch (NullPointerException e) {
            log.warn("文档库删除消息监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_DOCLIB_REMOVE, e, msg);
			log.warn("文档库删除消息监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
}
