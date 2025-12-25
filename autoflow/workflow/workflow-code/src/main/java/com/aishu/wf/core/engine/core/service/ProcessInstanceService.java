package com.aishu.wf.core.engine.core.service;

import com.aishu.wf.core.engine.core.model.*;
import com.aishu.wf.core.engine.core.model.dto.ProcessInstanceDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessTaskDTO;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.task.Task;

import java.util.List;
import java.util.Map;


/**
 * @description  流程实例Service
 * @author lw
 */
public interface ProcessInstanceService extends ActivitiService {

    /**
     * 查询实例列表
     *
     * @param queryDTO 查询对象
     * @return
     */
    IPage<ProcessInstanceModel> findInstanceList(ProcessInstanceDTO queryDTO);

    /**
     * 查询流程实例日志
     *
     * @param id   流程实例ID
     * @param type 类型（text:文本，image:图像）
     * @return
     */
    ProcessInstanceLog getProcLogs(String id, String type);

    /**
     * 获取任务实例
     *
     * @param taskId
     * @return
     * @throws WorkFlowException
     */
    ActivityInstanceModel getTask(String taskId) throws WorkFlowException;

    ActivityInstanceModel getHistoryTask(String taskId) throws WorkFlowException;

    List<HistoricTaskInstance> getHistoryTaskList(String processInstanceId) throws WorkFlowException;

    /**
     * 获取流程变量
     *
     * @param processInstanceId
     * @return
     * @throws WorkFlowException
     */
    Map<String, Object> getProcessInstanceVariables(String processInstanceId) throws WorkFlowException;

    /**
     * 获取流程变量
     *
     * @param processInstanceId
     * @return
     * @throws WorkFlowException
     */
    Object getProcessInstanceVariables(String processInstanceId, String key) throws WorkFlowException;

    /**
     * 获取流程实例信息
     *
     * @param procInstId
     * @return
     * @throws WorkFlowException
     */
    ProcessInstanceModel getProcessInstanceById(String procInstId) throws WorkFlowException;

    /**
     * 获取流程实例信息
     *
     * @param bizKey
     * @return
     * @throws WorkFlowException
     */
    ProcessInstanceModel getProcessInstanceByBizKey(String bizKey) throws WorkFlowException;
    /**
     * 获取流程实例列表信息
     *
     * @param bizKey
     * @return
     * @throws WorkFlowException
     */
    List<ProcessInstanceModel> getProcessInstancesByBizKey(String bizKey) throws WorkFlowException;

    /**
     * 获取任务变量
     *
     * @param taskId
     * @return
     * @throws WorkFlowException
     */
    Map<String, Object> getTaskVariables(String taskId) throws WorkFlowException;

    /**
     * 获取任务变量
     *
     * @param taskId
     * @return
     * @throws WorkFlowException
     */
    Map<String, Object> getHistoryTaskVariables(String taskId) throws WorkFlowException;

    /**
     * 获取任务的Fields变量
     *
     * @param taskId
     * @return
     * @throws WorkFlowException
     */
    ProcessInputModel getProcessInputVariableByTask(String taskId) throws WorkFlowException;

    /**
     * 获取流程的Fields变量
     *
     * @param procInstId
     * @return
     * @throws WorkFlowException
     */
    ProcessInputModel getProcessInputVariable(String procInstId) throws WorkFlowException;

    /**
     * 获取流程的Fields变量
     *
     * @param procInstId
     * @return
     * @throws WorkFlowException
     */
    ProcessInputModel getProcessInputVariableByFinished(String procInstId) throws WorkFlowException;

    /**
     * 获取流程业务变量
     *
     * @param procInstId 流程实例Id
     * @return
     * @throws WorkFlowException
     */

    BusinessDataObject getBusinessDataObject(String procInstId) throws WorkFlowException;

    /**
     * 获取办结流程的任务实例
     *
     * @param procInstId
     * @param endTaskId
     * @return
     * @throws WorkFlowException
     */
    ActivityInstanceModel getTaskByProcessFinished(String procInstId, String endTaskId) throws WorkFlowException;

    /**
     * 获取未结束流程的最后一个用户任务
     *
     * @param procInstId
     * @param endActivityId
     * @return
     * @throws WorkFlowException
     */
    ActivityInstanceModel getLastTaskNotFinished(String procInstId, String endActivityId) throws WorkFlowException;

    /**
     * 获取所有流程意见列表
     *
     * @param procInstId
     * @return
     */
    List<ProcessLogModel> getProcessComments(String procInstId);

    /**
     * 流程作废
     *
     * @param procInstId 流程实例ID
     * @param userId     用户ID
     */
    Boolean processInstanceToCancel(String procInstId, String userId,String reason) throws Exception;

    /**
     * 流程批量作废
     *
     * @param procInstIds 流程实例ID集合
     * @param userId      当前操作用户ID
     * @return
     */
    List<String> processInstanceBatchCancel(List<String> procInstIds, String userId,String reason) throws Exception;

    /**
     * 在对应的流程中给增加一个用户待办任务
     *
     * @param userId            用户ID
     * @param processInstanceId 流程实例ID
     * @return
     */
    Boolean addTaskForInstance(String userId, String processInstanceId);

    /**
     * 在对应的流程中给增加一个用户待办任务（串行多实例）
     *
     * @param userId            用户ID
     * @param processInstanceId 流程实例ID
     * @return
     */
    Boolean addTaskForInstanceSerial(String userId, String processInstanceId);

    /**
     * 根据用户ID删除所有任务，如果任务没有其他审核员，会自动作废流程
     *
     * @param userId 用户ID
     * @return
     */
    List<String> deleteAllTaskByUserId(String userId,String reason);

    /**
     * 根据用户ID删除对应流程实例中的用户任务
     *
     * @param userId            用户ID
     * @param processInstanceId 流程实例ID
     * @return
     */
    List<String> deleteTaskForInstance(String userId, String processInstanceId,String reason);

    /**
     * 重新分配审核人员
     *
     * @param id      任务ID
     * @param auditor 审核员
     */
    void againSetTaskAuditor(String id, String oldAuditor, String auditor, String topExecutionId) throws Exception;

    /**
     * 获取待办任务列表
     *
     * @param queryDTO
     * @return
     */
    IPage<ProcessTaskModel> findTaskList(ProcessTaskDTO queryDTO);
    /**
     * 获取当前流程待办
     * @param processInstanceId
     * @param receiver
     * @return
     */
    Task getProcessTask(String processInstanceId, String receiver);

    List<Task> getProcessTasks(String processInstanceId, String curActDefId);

	/**
	 * 获取判断用户是否具备审核权限
	 *
	 * @param type
	 * @param procInstId
	 * @param auditor
	 * @return
	 */
    boolean checkAuditAuth(String type, String procInstId, String auditor, int csfLevel);
}
