package com.aishu.wf.core.engine.core.listener;

import org.activiti.bpmn.model.ExpandProperty;
import org.activiti.bpmn.model.UserTask;
import org.activiti.engine.impl.bpmn.parser.BpmnParse;
import org.activiti.engine.impl.bpmn.parser.handler.UserTaskParseHandler;
import org.activiti.engine.impl.pvm.process.ActivityImpl;

import com.aishu.wf.core.engine.util.ProcessModelUtils;

/**
 * @作者 lw
 * @创建时间 2021年2月18日
 * @说明
 */
public class ExtensionUserTaskParseHandler extends UserTaskParseHandler {

	@Override
	protected void executeParse(BpmnParse bpmnParse, UserTask userTask) {
		// 调用上层的解析
		super.executeParse(bpmnParse, userTask);
		ActivityImpl activity = bpmnParse.getCurrentScope().findActivity(userTask.getId());
		ExpandProperty editExpandProperty=ProcessModelUtils.findExpandProperties(userTask.getExpandProperties(),"dealType");
		if(editExpandProperty!=null) {
			// 将扩展属性设置给activity
			activity.setProperty("dealType", editExpandProperty.getValue());
		}
	}

	    
}
