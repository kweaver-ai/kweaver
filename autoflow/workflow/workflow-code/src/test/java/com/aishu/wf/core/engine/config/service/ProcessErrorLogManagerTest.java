package com.aishu.wf.core.engine.config.service;

import cn.hutool.core.util.IdUtil;
import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.dao.ProcessErrorLogDao;
import com.aishu.wf.core.engine.config.model.ProcessErrorLog;
import com.aishu.wf.core.engine.config.service.ProcessErrorLogManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 流程异常日志测试用例
 * @author ouandyang
 * @date 2021年5月7日
 */
@DisplayName("流程异常日志测试用例")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class ProcessErrorLogManagerTest {

    @Autowired
    private ProcessErrorLogManager processErrorLogManager;
    @Autowired
    private ProcessErrorLogDao processErrorLogDao;

    @Test
    @DisplayName("保存")
    public void saveTest(){
        ProcessErrorLog processErrorLog = new ProcessErrorLog();
        processErrorLog.setProcessInstanceId(IdUtil.randomUUID());
        processErrorLog.setCreator(IdUtil.randomUUID());
        processErrorLog.setProcessMsg("测试用例");
        processErrorLogManager.save(processErrorLog);
        ProcessErrorLog temp = processErrorLogDao.selectById(processErrorLog.getPelogId());
        Assertions.assertNotNull(temp);
    }

}
