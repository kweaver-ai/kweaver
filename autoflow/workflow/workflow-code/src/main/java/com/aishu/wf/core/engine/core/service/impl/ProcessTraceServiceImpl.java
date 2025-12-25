package com.aishu.wf.core.engine.core.service.impl;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.config.service.ActivityInfoConfigManager;
import com.aishu.wf.core.engine.core.cmd.GetProcessTraceCmd;
import com.aishu.wf.core.engine.core.model.ProcessInstanceLog;
import com.aishu.wf.core.engine.core.model.ProcessLogModel;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessTraceService;
import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import lombok.extern.slf4j.Slf4j;
import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.engine.history.HistoricActivityInstance;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.persistence.entity.HistoricActivityInstanceEntity;
import org.activiti.engine.impl.persistence.entity.HistoricTaskInstanceEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.task.Attachment;
import org.activiti.engine.task.Comment;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ProcessTraceServiceImpl extends AbstractServiceHelper implements ProcessTraceService {

    @Resource
    private UserService userService;

    @Autowired
    private OrgService orgService;

    @Autowired
    ActivityInfoConfigManager activityInfoConfigManager;

	/**
	 * 获取当前任务日志(不包含节点任务）
	 *
	 * @param procInstId
	 * @return 返回相同的历史任务、意见等数据
	 */
	@Override
	public ProcessInstanceLog getHisTaskLog(String procInstId, boolean hasStart, boolean hasEnd) {
		ProcessInstanceLog processInstanceLog = new ProcessInstanceLog();
		HistoricProcessInstance curProcessInstance = historyService.createHistoricProcessInstanceQuery()
				.processInstanceId(procInstId).singleResult();
		if (curProcessInstance == null) {
			throw new IllegalArgumentException(String.format("流程实例ID[%s]不存在", procInstId));
		}

		List<HistoricTaskInstance> historicTaskInstances = historyService.createHistoricTaskInstanceQuery()
				.processInstanceId(curProcessInstance.getId()).orderByTaskCreateTime().desc().list();
		// 获取当前流程所有意见
		Map<String, List<Comment>> commentMaps = allComments(procInstId);

		List<Attachment> attachments = taskService.getProcessInstanceAttachments(curProcessInstance.getId());
		Map<String, List<String>> attachmentMap = attachments.stream()
			.filter(obj -> obj.getUserId() != null)
			.collect(Collectors.groupingBy(Attachment::getUserId,Collectors.mapping(Attachment::getUrl, Collectors.toList())));

		// 处理发起节点逻辑
		if (hasStart) {
			addStartTask(curProcessInstance, historicTaskInstances);
		}
		// 处理结束节点逻辑
		if (hasEnd) {
			addEndTask(curProcessInstance, historicTaskInstances, commentMaps);
		}
		List<ProcessLogModel> processDetailLogs = Lists.newArrayList();
		// 存储当前流程已运行的环节列表
		Map<String, HistoricTaskInstance> allActivitys = Maps.newHashMap();
		for (HistoricTaskInstance historicTask : historicTaskInstances) {
			HistoricTaskInstanceEntity historicTaskInstance = (HistoricTaskInstanceEntity) historicTask;
			if (historicTaskInstance.getDeleteReason() != null
					&& "custom-completed".equals(historicTaskInstance.getDeleteReason())) {
				continue;
			}
			if (historicTaskInstance.getDeleteReason() != null
					&& "receiver_transfer".equals(historicTaskInstance.getDeleteReason())) {
				continue;
			}
			if (!allActivitys.containsKey(historicTask.getTaskDefinitionKey())) {
				allActivitys.put(historicTask.getTaskDefinitionKey(), historicTask);
			}

			List<Comment> comments = commentMaps.get(historicTaskInstance.getId());
			// 处理接收人、发送人逻辑
			String assigneeUserName = historicTaskInstance.getAssigneeOrgId();
			String assigneeOrgName = historicTaskInstance.getAssigneeOrgName();
			String sendUserName = historicTaskInstance.getSendUserName();
			String senderOrgName = historicTaskInstance.getSenderOrgName();
			String assigneeAccount = "";

			if ((StringUtils.isEmpty(assigneeUserName))
					&& StringUtils.isNotEmpty(historicTaskInstance.getAssignee())
					&& !historicTaskInstance.getAssignee().contains(",")) {
				try {
					User assigneeUser = userService.getUserById(historicTaskInstance.getAssignee());
					assigneeUserName = assigneeUser.getUserName();
					assigneeOrgName = assigneeUser.getDirectDeptInfoList().get(0).getName();
					assigneeAccount = assigneeUser.getUserCode();
				} catch (Exception e) {
					log.warn("",e);
				}
			}
			if (StringUtils.isEmpty(historicTaskInstance.getSendUserName())
					&& StringUtils.isEmpty(historicTaskInstance.getSenderOrgName())
					&& StringUtils.isNotEmpty(historicTaskInstance.getSender())) {
				try {
					User sendUser = userService.getUserById(historicTaskInstance.getSender());
					sendUserName = sendUser.getUserName();
					senderOrgName = sendUser.getDirectDeptInfoList().get(0).getName();
				} catch (Exception e) {
					log.warn("",e);
				}
			}
			// 包装ProcessLogModel
			ProcessLogModel processDetailLog = new ProcessLogModel();
			processDetailLog.setActionType(historicTaskInstance.getActionType());
			processDetailLog.setActDefKey(historicTaskInstance.getTaskDefinitionKey());
			processDetailLog.setActDefName(historicTaskInstance.getName());
			processDetailLog.setActInstId(historicTaskInstance.getId());

			// 多实例任务由用户删除导致任务删除的原因处理
			String multiinstanceActivityUserDelete = WorkFlowContants.ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY + "_" + DocConstants.USER_DELETED;
			String deleteReason = (null != historicTaskInstance.getDescription() && historicTaskInstance.getDescription().equals(multiinstanceActivityUserDelete))
					? multiinstanceActivityUserDelete : historicTaskInstance.getDeleteReason();
			processDetailLog.setDeleteReason(deleteReason);
			processDetailLog.setEndTime(historicTaskInstance.getEndTime());
			processDetailLog.setStartTime(historicTaskInstance.getStartTime());
			processDetailLog.setProcessInstanceId(historicTaskInstance.getProcessInstanceId());
			processDetailLog.setComment(comments != null && !comments.isEmpty() ? comments.get(0) : null);
			processDetailLog.setSendUserName(sendUserName);
			processDetailLog.setSendUserId(historicTaskInstance.getSendUserId());
			processDetailLog.setSendOrgId(historicTaskInstance.getSenderOrgId());
			processDetailLog.setSendOrgName(senderOrgName);
			processDetailLog.setReceiveUserName(assigneeUserName);
			processDetailLog.setReceiveUserAccount(assigneeAccount);
			processDetailLog.setReceiveUserId(historicTaskInstance.getAssignee());
			processDetailLog.setReceiveOrgId(historicTaskInstance.getAssigneeOrgId());
			processDetailLog.setReceiveOrgName(assigneeOrgName);
			processDetailLog.setFinishState(historicTaskInstance.getEndTime()!=null?"2":"1");
			processDetailLog.setActDefModel(historicTaskInstance.getFormKey()==null?"tjsh":historicTaskInstance.getFormKey());
			if(historicTaskInstance.getPreTaskDefName()!=null&&(historicTaskInstance.getPreTaskDefName().equals(BpmnXMLConstants.ELEMENT_EVENT_START)||historicTaskInstance.getPreTaskDefName().equals(BpmnXMLConstants.ELEMENT_EVENT_END))) {
				processDetailLog.setActDefType(historicTaskInstance.getPreTaskDefName());
			}else {
				processDetailLog.setActDefType(BpmnXMLConstants.ELEMENT_TASK_USER);
			}
			try {
				if (StringUtils.isNotBlank(historicTaskInstance.getOwner())) {
					try {
						User owner = userService.getUserById(historicTaskInstance.getOwner());
						sendUserName = owner.getUserName();
						processDetailLog.setOwnerName(sendUserName);
					} catch (Exception e) {
						log.warn("",e);
					}
				}
			} catch (Exception e) {
				log.warn(String.format("获取委托人owner的userName出现异常,procInstId[%s],userId[%s]", procInstId,
						historicTaskInstance.getOwner()), e);
			}
			if("multilevel".equals(historicTask.getDescription())) {
				processDetailLog.setMultilevel("Y");
			}
			processDetailLog.setPreTaskId(StrUtil.isNotEmpty(historicTask.getPreTaskId()) ? historicTask.getPreTaskId() : "empty");
			processDetailLog.setProcStatus(historicTaskInstance.getStatus());
			processDetailLog.setAttachments(attachmentMap.get(historicTaskInstance.getAssignee()));
			processDetailLogs.add(processDetailLog);
		}
		processInstanceLog.setCurrentProcessInstance(curProcessInstance);
		processInstanceLog.setProcessDetailLogs(processDetailLogs);

		// 查询审核员账号
		List<ProcessLogModel> processLogModelList = processInstanceLog.getProcessDetailLogs();
		List<String> receiveUserIds = processLogModelList.stream().map(ProcessLogModel::getReceiveUserId).collect(Collectors.toList());
		List<User> userList = userService.getUserList(receiveUserIds);
		for(ProcessLogModel processLogModel : processLogModelList){
			List<User> currentUserList = userList.stream().filter(u -> null != u && u.getUserId().equals(processLogModel.getReceiveUserId())).collect(Collectors.toList());
			processLogModel.setReceiveUserAccount(currentUserList.size() > 0 ? currentUserList.get(0).getUserCode() : "");
		}
		return processInstanceLog;
	}

    @Override
    public List<Map<String, Object>> getProcessTrace(String proceInstaceId) {
        Command<List<Map<String, Object>>> cmd = new GetProcessTraceCmd(
                proceInstaceId);
        List<Map<String, Object>> result = null;
        try {
            result = getManagementService().executeCommand(cmd);
        } catch (Exception e) {
            log.warn("", e);
        }
        return result;
    }

    /**
     * 根据流程ID获取意见
     *
     * @param curProcessInstanceId
     * @return
     */
    private Map<String, List<Comment>> allComments(String curProcessInstanceId) {
        LinkedHashMap<String, List<Comment>> commentMaps = new LinkedHashMap<String, List<Comment>>();
        try {
            List<Comment> allComments = taskService
                    .getProcessInstanceComments(curProcessInstanceId);
            for (Comment comment : allComments) {
                if (commentMaps.containsKey(comment.getTaskId())) {
                    ((List) commentMaps.get(comment.getTaskId())).add(comment);
                } else {
                    List tempComments = new ArrayList();
                    tempComments.add(comment);
                    commentMaps.put(comment.getTaskId(), tempComments);
                }
            }
        } catch (Exception e) {
            log.warn("", e);
        }
        return commentMaps;
    }

	/**
	 * 添加开始节点至historicTaskInstances
	 *
	 * @param curProcessInstance
	 * @param historicTaskInstances
	 */
	private void addStartTask(HistoricProcessInstance curProcessInstance,
			List<HistoricTaskInstance> historicTaskInstances) {
		// 将开始节点加入historicTaskInstances中
		HistoricActivityInstance hisActInst = historyService.createHistoricActivityInstanceQuery()
				.processInstanceId(curProcessInstance.getId()).activityId(curProcessInstance.getStartActivityId())
				.singleResult();

		if (hisActInst == null) {
			return;
		}
		HistoricTaskInstanceEntity task = new HistoricTaskInstanceEntity();
		task.setAssignee(curProcessInstance.getStartUserId());
		task.setAssigneeUserName(curProcessInstance.getStartUserName());
		task.setAssigneeOrgId(curProcessInstance.getStarterOrgId());
		task.setAssigneeOrgName(curProcessInstance.getStarterOrgName());
		task.setId(hisActInst.getId());
		task.setProcessInstanceId(hisActInst.getProcessInstanceId());
		task.setExecutionId(hisActInst.getExecutionId());
		task.setTaskDefinitionKey(hisActInst.getActivityId());
		task.setName(hisActInst.getActivityName());
		task.setActionType(hisActInst.getActivityType());
		task.setStartTime(hisActInst.getStartTime());
		task.setEndTime(hisActInst.getEndTime());
		task.setPreTaskDefName(hisActInst.getActivityType());
		historicTaskInstances.add(0, (HistoricTaskInstance) task);

	}

	/**
	 * 添加结束节点至historicTaskInstances
	 *
	 * @param curProcessInstance
	 * @param historicTaskInstances
	 * @param commentMaps
	 */
	private void addEndTask(HistoricProcessInstance curProcessInstance,
			List<HistoricTaskInstance> historicTaskInstances, Map<String, List<Comment>> commentMaps) {
		if (curProcessInstance.getProcState() != SuspensionState.FINISH.getStateCode()
				|| curProcessInstance.getEndTime() == null || curProcessInstance.getEndActivityId() == null) {
			return;
		}

		// 将办结节点加入historicTaskInstances中
		List<HistoricActivityInstance> hisActInsts = historyService.createHistoricActivityInstanceQuery()
				.processInstanceId(curProcessInstance.getId()).activityId(curProcessInstance.getEndActivityId())
				.orderByHistoricActivityInstanceStartTime().desc().list();
		if (hisActInsts == null || hisActInsts.isEmpty()) {
			return;
		}
		HistoricActivityInstanceEntity hisActInst = (HistoricActivityInstanceEntity) hisActInsts.get(0);
		HistoricTaskInstanceEntity task = new HistoricTaskInstanceEntity();
		if (hisActInst != null) {
			task.setSender(hisActInst.getSender());
			task.setSenderOrgId(hisActInst.getSenderOrgId());
			task.setSendUserId(hisActInst.getSendUserId());
			task.setSendUserName(hisActInst.getSendUserName());
			task.setSenderOrgName(hisActInst.getSenderOrgName());
			task.setId(hisActInst.getTaskId());
			task.setProcessInstanceId(hisActInst.getProcessInstanceId());
			task.setExecutionId(hisActInst.getExecutionId());
			task.setTaskDefinitionKey(hisActInst.getActivityId());
			String activityName = hisActInst.getActivityName();
			if ("endEvent".equals(hisActInst.getActivityType()) && StringUtils.isEmpty(activityName)) {
				activityName = "结束";
			}
			task.setName(activityName);
			task.setActionType(hisActInst.getActivityType());
			task.setPreTaskDefKey(hisActInst.getPreActId());
			task.setPreTaskDefName(hisActInst.getPreActName());
			task.setPreTaskId(hisActInst.getPreActInstId());
			task.setStartTime(hisActInst.getStartTime());
			task.setEndTime(hisActInst.getEndTime());
			task.setPreTaskDefName(hisActInst.getActivityType());
			historicTaskInstances.add((HistoricTaskInstance) task);
		}
		// 处理办结节点意见逻辑,只有子流程中有次逻辑
		if (StringUtils.isNotEmpty(task.getPreTaskDefKey()) && curProcessInstance.getSuperProcessInstanceId() != null
				&& !commentMaps.containsKey(task.getPreTaskId())) {
			List<Comment> tempComments = taskService.getTaskComments(task.getPreTaskId());
			if (tempComments != null && !tempComments.isEmpty()) {
				commentMaps.put(task.getPreTaskId(), taskService.getTaskComments(task.getPreTaskId()));
			}

		}

	}


}
