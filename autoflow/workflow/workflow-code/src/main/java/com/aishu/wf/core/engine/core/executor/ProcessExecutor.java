package com.aishu.wf.core.engine.core.executor;

import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
/**
 * 流程执行接口
 * @version:  1.0
 * @author lw 
 */
public interface ProcessExecutor {
	public ProcessInstanceModel execute(ProcessInputModel processInputModel)throws WorkFlowException;
}
