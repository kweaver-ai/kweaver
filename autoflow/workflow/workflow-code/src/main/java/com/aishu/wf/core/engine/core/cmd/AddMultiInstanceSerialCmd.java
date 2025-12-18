package com.aishu.wf.core.engine.core.cmd;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.aishu.wf.core.engine.util.WorkFlowException;
import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.activiti.engine.impl.persistence.entity.ExecutionEntityManager;
import org.activiti.engine.task.Task;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * 补发多实例命令类,暂时只支持补发单环节多人任务实例
 *
 * @author lw
 * @version 1.0
 * @modify Liuchu
 * @date 2021-3-29 11:18:13
 * @created 07-四月-2013 15:39:01
 */
public class AddMultiInstanceSerialCmd implements Command<Void>, Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 当前任务实例ID
     */
    protected String taskId;
    /**
     * 补发接收人列表
     */
    protected List<String> receivers;
    protected Map<String, Object> variables;

    /**
     * 实例数
     */
    protected final String NUMBER_OF_INSTANCES = "nrOfInstances";

    public AddMultiInstanceSerialCmd(String taskId, List<String> receivers,
                                     Map<String, Object> variables) {
        this.taskId = taskId;
        this.receivers = receivers;
        this.variables = variables;
    }

    @Override
    public Void execute(CommandContext commandContext) {
        // 获取当前任务实例
        Task task = commandContext.getTaskEntityManager().findTaskById(taskId);
        String processInstanceId = task.getProcessInstanceId();
        // 获取发起多实例的任务实例
        ExecutionEntityManager executionEntityManager = commandContext.getExecutionEntityManager();
        List<ExecutionEntity> parentExecutions = executionEntityManager.findChildExecutionsByParentExecutionId(processInstanceId);
        ExecutionEntity executionEntityOfMany = parentExecutions.get(0);
        try {
            executionEntityOfMany.setVariableLocal(WorkFlowContants.ELEMENT_ASSIGNEE_LIST, receivers);
            executionEntityOfMany.setVariable(NUMBER_OF_INSTANCES, receivers.size());
        } catch (Exception e) {
        	throw new WorkFlowException(ExceptionErrorCode.A1000,"AddMultiInstanceSerialCmd error",e);
        }
        return null;
    }

}
