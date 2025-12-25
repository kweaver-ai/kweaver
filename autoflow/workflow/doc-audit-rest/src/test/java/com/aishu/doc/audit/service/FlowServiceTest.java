package com.aishu.doc.audit.service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.aishu.doc.DocAuditRestApplication;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.service.ProcessExecuteService;
import com.aishu.wf.core.engine.util.WorkFlowContants;

/**
 * @description 文档审核申请服务类测试用例
 * @author ouandyang
 */
@DisplayName("流程测试用例")
@ActiveProfiles("")
@SpringBootTest(classes = DocAuditRestApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class FlowServiceTest {
  
    @Autowired
    private ProcessExecuteService processExecuteService;

	@Test
	@DisplayName("查询我的待办列表")
	public void execute() {
		ProcessInputModel processInputModel=new ProcessInputModel();
		processInputModel.setWf_actionType(WorkFlowContants.ACTION_TYPE_END_PROCESS);
		processInputModel.setWf_procInstId("f22f0aa4-9564-11ec-a4c6-00ff0fa3e6a7");
		processInputModel.setWf_sendUserId("95c481fc-953a-11ec-b7af-080027383fc3");
		processExecuteService.nextExecute(processInputModel);

	}

}
