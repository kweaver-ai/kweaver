package com.aishu.wf.core.engine.core.service.impl;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.config.CustomConfig;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author lw
 */
@Slf4j
@Service
public class TaskResourceService extends AbstractServiceHelper {
	public static final String WORKFLOW_TYPE_SHARE = "doc_share";

	@Autowired
	private CustomConfig customConfig;
	@Autowired
	private DocShareStrategyService docShareStrategyService;

	/**
	 * 返回多实例审核员
	 *
	 * @return
	 */
	public List<String> getNextActivityUser(ProcessInputModel processInputModel) {
//		List<String> assigneeList = getShareMutilAssignee(processInputModel);
//		// 文件共享审核流程特殊处理（审核范围-审核员）
//		if (WORKFLOW_TYPE_SHARE.equals(processInputModel.getWf_uniteCategory())) {
//			assigneeList = getShareMutilAssignee(processInputModel);
//		} else {
//			assigneeList = getDefaulMutilAssignee(processInputModel);
//		}
		return getShareMutilAssignee(processInputModel);
	}

	/**
	 * 获取匹配审核范围+审核员+文件密级的审核员
	 *
	 * @param processInputModel
	 * @return
	 */
	private List<String> getShareMutilAssignee(ProcessInputModel processInputModel) {
		List<DocShareStrategyAuditor> list = Lists.newArrayList();
		try {
			Map<String, Object> fields = processInputModel.getFields();
			String docId = fields.get("docId") != null ? fields.get("docId").toString() : null;
			String docLibType = fields.containsKey("docLibType") ? fields.get("docLibType").toString() : null;
			Integer docCsfLevel = Integer.valueOf(fields.get("docCsfLevel").toString());
			String procDefId = processInputModel.getWf_procDefId();
			list = docShareStrategyService.getDocAuditorList(procDefId,processInputModel.getWf_curActDefId(), docId, docLibType,
					docCsfLevel, processInputModel.getWf_starter(), processInputModel.getWf_procInstId(), null, fields);
		} catch (Exception e) {
			throw (WorkFlowException) e;
		}
		List<String> assigneeList = list.stream().map(DocShareStrategyAuditor::getUserId).collect(Collectors.toList());
		return assigneeList;
	}

	/**
	 * 获取普通默认的审核员
	 *
	 * @param processInputModel
	 * @return
	 */
	private List<String> getDefaulMutilAssignee(ProcessInputModel processInputModel) {
		List<String> receiverList = new ArrayList<>();
		// 获取客户端接受人员列表
		String receiver = processInputModel.getWf_receiver();

		if (StringUtils.isNotEmpty(receiver) && !processInputModel.isWf_webAutoQueryNextUserFlag()) {
			// 输入、输出节点都是多实例的情况下,自动创建assigneeList变量
			if (processInputModel.getWf_curActDefType() != null
					&& "multiInstance".equals(processInputModel.getWf_curActDefType())) {
				receiverList = convertReceivers(processInputModel.getWf_receiver());
			}
			return receiverList;
		}
		ProcessDefinitionService processDefinitionService = (ProcessDefinitionService) ApplicationContextHolder
				.getBean("processDefinitionServiceImpl");

		List<ActivityResourceModel> users;
		// 流程发起获取审核员
		if (StringUtils.isEmpty(processInputModel.getWf_procInstId())) {
			users = processDefinitionService.getResource(processInputModel.getWf_procDefId(),
					processInputModel.getWf_curActDefId());
		} else {
			// 流程执行获取审核员
			users = processDefinitionService.getActivityUserTree(processInputModel.getWf_procInstId(),
					processInputModel.getWf_procDefId(), processInputModel.getWf_curActInstId(),
					processInputModel.getWf_curActDefId(), processInputModel.getWf_nextActDefId(),
					processInputModel.getWf_sendUserId(), processInputModel.getWf_sendUserOrgId(), null,
					processInputModel.getFields());
		}
		if (users == null || users.isEmpty()) {
			log.info("multiintsnace setAssigneeList error,getResource is empty,execution:"
					+ processInputModel.getWf_procDefId() + "|" + processInputModel.getWf_curActDefId());
			throw new WorkFlowException(ExceptionErrorCode.S0001, "当前无匹配的审核员，本次操作无法生效，请联系管理员。");
		}
		for (ActivityResourceModel treeNode : users) {
			if ("USER".equals(treeNode.getType())) {
				receiverList.add(treeNode.getRealId());
			}
		}
		return receiverList;
	}

	protected List<String> convertReceivers(String receiver) {
		String[] receiverArray;
		if (receiver.contains(StrUtil.COMMA)) {
			receiverArray = receiver.split(StrUtil.COMMA);
		} else {
			receiverArray = new String[] { receiver };
		}
		List<String> receiverList = new ArrayList<>(receiverArray.length);
		CollectionUtils.addAll(receiverList, receiverArray);
		return receiverList;
	}

}
