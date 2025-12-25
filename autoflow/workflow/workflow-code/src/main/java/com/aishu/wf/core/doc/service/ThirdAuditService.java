package com.aishu.wf.core.doc.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.doc.model.ThirdAuditModel;
import com.aishu.wf.core.doc.model.dto.ThirdAuditNotificationDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.model.DictChild;
import com.aishu.wf.core.engine.config.service.DictService;
import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

/**
 * 第三方审核处理服务
 *
 * @author Liuchu
 * @since 2021-2-23 18:13:56
 */
@Slf4j
@Service
public class ThirdAuditService {
	private final static String THIRD_AUDIT_CONFIG_DICT_CODE = "dsf_audit_config";
	private final static String IS_OPEN = "isOpen";
	private final static String WEBHOOK_URL = "webhookUrl";
	private NsqSenderService nsqSenderService;
	@Resource
	private DictService dictService;

	/**
	 * @description 判断第三方审核是否启用（启用且配置了webhook地址才使用第三方审核）
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	public boolean isThirdAuditEnabled() {
		boolean flag = false;
		Dict dict = dictService.findDictByCode(THIRD_AUDIT_CONFIG_DICT_CODE);
		if (dict != null) {
			List<DictChild> dictValue = dict.getDictValue();
			String jsonString = JSON.toJSONString(dictValue);
			List<DictChild> childList = JSON.parseArray(jsonString, DictChild.class);
			boolean isOpen = false;
			boolean hasWebhookUrl = false;
			for (DictChild dictChild : childList) {
				if (IS_OPEN.equals(dictChild.getDictCode())) {
					isOpen = Boolean.parseBoolean(dictChild.getDictName());
				}
				if (WEBHOOK_URL.equals(dictChild.getDictCode())) {
					hasWebhookUrl = StrUtil.isNotBlank(dictChild.getDictName());
				}
			}
			// 启用且配置了webhook地址
			flag = isOpen && hasWebhookUrl;
		}
		return flag;
	}

	/**
	 * @description 获取第三方审核地址
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	public String getThirdAuditWebhookUrl() {
		Dict dict = dictService.findDictByCode(THIRD_AUDIT_CONFIG_DICT_CODE);
		if (dict != null) {
			List<DictChild> dictValue = dict.getDictValue();
			String jsonString = JSON.toJSONString(dictValue);
			List<DictChild> childList = JSON.parseArray(jsonString, DictChild.class);
			for (DictChild dictChild : childList) {
				if (WEBHOOK_URL.equals(dictChild.getDictCode())) {
					return dictChild.getDictName();
				}
			}
		}
		return null;
	}

	/**
	 * @description 提交第三方审核
	 * @author ouandyang
	 * @param thirdAuditModel
	 * @updateTime 2021/5/13
	 */
	public String commitThirdAudit(ThirdAuditModel thirdAuditModel) throws Exception {
		String webhookUrl = this.getThirdAuditWebhookUrl();
		if (StrUtil.isBlank(webhookUrl)) {
			throw new Exception("未配置第三方审核地址");
		}
		String url = webhookUrl + "/audit";
		return HttpUtil.post(url, JSON.toJSONString(thirdAuditModel));
	}

	/**
	 * @description 提交第三方审核
	 * @author ouandyang
	 * @param bean
	 * @updateTime 2021/5/13
	 */
	public boolean thirdAudit(ThirdAuditModel thirdAuditModel) throws Exception {
		/*ThirdAuditModel thirdAuditModel = ThirdAuditModel.builder().applyid(bean.getBizId())
				.createdate(String.valueOf(bean.getApplyTime().getTime() * 1000)).creatorName(bean.getApplyUserName())
				.csflevel(bean.getCsfLevel().toString()).docid(bean.getDocId()).docname(bean.getDocPath())
				.eventtype(bean.getApplyType()).isdir(String.valueOf(Objects.equals("folder", bean.getDocType())))
				.build();
		JSONObject detail = JSONUtil.parseObj(bean.getApplyDetail());
		if (detail.get("expiresAt") != null) {
			thirdAuditModel.setEndtime(detail.get("expiresAt").toString());
		}
		if (detail.get("accessorName") != null) {
			thirdAuditModel.setAccessorname(detail.get("accessorName").toString());
		}
		if (detail.get("accessorType") != null) {
			thirdAuditModel.setAccessorname(detail.get("accessorType").toString());
		}
		if (detail.get("allowValue") != null) {
			thirdAuditModel.setAccessorname(detail.get("allowValue").toString());
		}
		if (detail.get("denyValue") != null) {
			thirdAuditModel.setAccessorname(detail.get("denyValue").toString());
		}
		if (detail.get("opType") != null) {
			thirdAuditModel.setAccessorname(detail.get("opType").toString());
		}*/
		//isThirdAuditEnabled返回true，就不进入内部流程审核
		boolean isThirdAuditEnabled=false;
		// 如果开启第三方审核，文档流转审核、共享审核、定密审核都将通知至第三方
        isThirdAuditEnabled = this.isThirdAuditEnabled();
        if (isThirdAuditEnabled) {
        	this.commitThirdAudit(thirdAuditModel);
        }
        return isThirdAuditEnabled;
	}

	 /**
     * @description 发送第三方审核结果通知
     * @author ouandyang
     * @param  notification
     * @updateTime 2021/5/13
     */
    public void sendAuditNotification(ThirdAuditNotificationDTO notification) {
        nsqSenderService.sendAuditNotify(notification.getType(), notification.getApplyid(),
                notification.getResult());
    }
}