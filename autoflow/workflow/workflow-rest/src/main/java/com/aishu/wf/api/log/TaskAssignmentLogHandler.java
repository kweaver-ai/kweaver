package com.aishu.wf.api.log;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.log.handler.AbstractLogHandler;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.I18nController;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.aishu.wf.core.thrift.eacplog.ncTManagementType;
import org.activiti.engine.TaskService;
import org.activiti.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * @description 处理流程任务重新分配审核员操作日志类
 * @author hanj
 */
@Component(value = OperationLogConstants.TASK_ASSIGNMENT_LOG)
public class TaskAssignmentLogHandler extends AbstractLogHandler implements LogHandler {

    @Resource
    private UserService userService;

    @Autowired
    private TaskService taskService;
    @Autowired
    private I18nController i18n;



    /**1
     * @description 构建操作日志详情
     * @author hanj
     * @param args args
     * @updateTime 2021/7/27
     */
    @Override
    public OperationLogDTO buildLogMsg(Object[] args) {
        String taskId = (String) args[0];
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();

        OperationLogDTO log = new OperationLogDTO();
        log.setMsg(this.buildMsg(task, args));
        log.setExMsg(this.buildExMsg(task, args));
        log.setLogType(ncTLogType.NCT_LT_MANAGEMENT);
        log.setOpType(this.getOpType());
        return log;
    }

    /**
     * @description 构建操作描述
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildMsg(Task task, Object[] args) {
        String taskId = (String) args[0];
        String receiver = (String) args[1];
        User receiverInfo = userService.getUserById(receiver);
        return StrUtil.format(i18n.getMessage("assignToApprover"), task.getName(), taskId, receiverInfo.getUserName(), receiverInfo.getUserId());
    }

    /**
     * @description 构建操作详情
     * @author hanj
     * @param  args
     * @updateTime 2021/4/30
     */
    public String buildExMsg(Task task, Object[] args) {
        String assigneeUserId = task.getAssigneeUserId();
        User assigneeInfo = userService.getUserById(assigneeUserId);
        return StrUtil.format(i18n.getMessage("previousApprover"), assigneeInfo.getUserName(), assigneeInfo.getUserId());
    }

    /**
     * @description 获取当前操作的类型
     * @author hanj
     * @param
     * @updateTime 2021/4/30
     */
    protected Integer getOpType() {
        return ncTManagementType.NCT_MNT_RESTORE.getValue();
    }
}
