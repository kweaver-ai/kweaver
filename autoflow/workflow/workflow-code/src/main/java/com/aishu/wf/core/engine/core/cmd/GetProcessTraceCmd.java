package com.aishu.wf.core.engine.core.cmd;

import java.util.List;
import java.util.Map;

import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;

import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowException;
/**
 * 获取流程轨迹，用于监控展现
 * @author lw
 */
public class GetProcessTraceCmd implements Command<List<Map<String, Object>>> {
    protected String processDefinitionId;

    public GetProcessTraceCmd(String processDefinitionId) {
        this.processDefinitionId = processDefinitionId;
    }

	public List<Map<String, Object>> execute(CommandContext commandContext) {
		try {
			CustomProcessTrace customProcessTrace = new CustomProcessTrace();
			return customProcessTrace.getProcessTrace(processDefinitionId);
		} catch (Exception ex) {
			throw new WorkFlowException(ExceptionErrorCode.A1000,"GetProcessTraceCmd error",ex);
		}
	}
}
