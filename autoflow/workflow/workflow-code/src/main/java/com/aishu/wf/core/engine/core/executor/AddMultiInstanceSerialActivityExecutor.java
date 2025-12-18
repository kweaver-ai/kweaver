package com.aishu.wf.core.engine.core.executor;

import com.aishu.wf.core.engine.core.cmd.AddMultiInstanceCmd;
import com.aishu.wf.core.engine.core.cmd.AddMultiInstanceSerialCmd;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.ProcessDefinitionUtils;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.google.common.collect.Maps;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.repository.ProcessDefinition;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 多实例（内嵌子例程）补发执行类
 *
 * @author lw
 * @version: 1.0
 */
@Service(WorkFlowContants.ACTION_TYPE_ADD_MULTIINSTANCE_SERIAL_ACTIVITY)
public class AddMultiInstanceSerialActivityExecutor extends AbstractProcessExecutor implements ProcessExecutor {

    @Override
    public ProcessInstanceModel execute(ProcessInputModel processInputModel) throws WorkFlowException {
        ProcessDefinition processDefinition = getProcessDefinition(processInputModel.getWf_procDefId());
        additionalProcessInputModel(processInputModel, processDefinition);
        ProcessInstance processInstance = getProcessInstance(processInputModel.getWf_procInstId());
        // 根据wfCurActInstId获取当前任务实例
        List<Task> tasks = processInstanceService.getProcessTasks(processInstance.getProcessInstanceId(), processInputModel.getWf_curActDefId());
        Task task = tasks.get(0);
        if (task == null) {
            String errorMsg = String.format("未找到流程实例ID[%S]、任务环节ID[%S]、发送人[%S]对应的待办任务！", processInputModel.getWf_procInstId(),
                    processInputModel.getWf_curActDefId(), processInputModel.getWf_sender());
            throw new WorkFlowException(ExceptionErrorCode.B2060, errorMsg);
        }
        // 根据wfCurActInstId获取当前任务实例
        Map<String, Object> workflowMap = Maps.newHashMap();
		/*
		 * // 设置页面fields if (StringUtils.isEmpty(processInputModel.getWf_fields())) {
		 * processInputModel.setWf_fields(PageFieldsUtil.fieldsToXml(processInputModel.
		 * getFields())); } workflowMap.put(WorkFlowContants.WF_FIELDS_KEY,
		 * processInputModel.getWf_fields());
		 */
        // 设置参数到引擎变量中
        workflowMap.put(WorkFlowContants.WF_PROCESS_INPUT_VARIABLE_KEY, processInputModel);
        workflowMap.putAll(processInputModel.getWf_variables());
        Command<Void> addMultiInstanceSerialCmd;
        boolean multiInstance = ProcessDefinitionUtils.isMultiInstance(processInputModel, repositoryService);
        // 多实例
        if (multiInstance || processInstance.getId().equals(processInstance.getTopProcessInstanceId())) {
            addMultiInstanceSerialCmd = new AddMultiInstanceSerialCmd(task.getId(),
                    convertReceivers(processInputModel.getWf_receiver()), workflowMap);
            this.managementService.executeCommand(addMultiInstanceSerialCmd);
        }
        return processInstanceModellBuilder.builderProcessInfo(processInputModel, processInstance, processDefinition);
    }

}
