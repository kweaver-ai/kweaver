package com.aishu.wf.core.engine.core.model;

import java.util.Date;

import org.activiti.engine.history.HistoricTaskInstance;
import org.activiti.engine.task.Comment;

import com.aishu.wf.core.engine.identity.model.Org;

import lombok.Data;
/**
 * 流程详细日志模型
 * 
 * @version: 1.0
 * @author lw
 */
@Data
public class ProcessDetailLog {
	private Comment comment;
	private HistoricTaskInstance historicTaskInstance;
	private String sendUserName;
	private String reiceiveUserName;
	private Org sendOrg;
	private Org receiveOrg;
	private String finishState;
	private String wirteConmentUserName;
}
