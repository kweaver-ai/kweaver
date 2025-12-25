package com.aishu.wf.core.engine.core.service.impl;

import cn.hutool.json.JSON;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import org.activiti.bpmn.model.BpmnModel;
import org.junit.jupiter.api.*;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import redis.embedded.RedisServer;

import java.io.File;
import java.nio.charset.Charset;
import java.nio.charset.CharsetEncoder;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/4/26 19:06
 */
@DisplayName("流程模型服务单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class ProcessModelNewServiceTest {

    @InjectMocks
    @Autowired
    private ProcessDefinitionService processDefinitionService = new ProcessDefinitionServiceImpl();

    @InjectMocks
    @Autowired
    private ProcessModelServiceImpl processModelService;;

    @InjectMocks
    @Autowired
    private ProcessInfoConfigManager processInfoConfigManager;

    @Mock
    private UserService userService;

    private static String PROCESS_DEFINITION_ID = "";

    private final static String PROCESS_DEFINITION_KEY = "Process_FJ6EP8NI";

    private final static String TENANT_ID = "as_workflow";

    private final static String TEST_PROCESS_DEFINITION_CREATE_USER = "9e4e7ebc-621a-11eb-935f-080027e6c16c";

    private static RedisServer server = null;

    @BeforeAll
    static void startRedis() {
        server = RedisServer.builder()
                .port(6379)
                .setting("maxmemory 64m")
                .build();
        server.start();
    }

    @AfterAll
    static void stopRedis() {
        if(null != server){
            server.stop();
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        User userC = new User();
        userC.setCsfLevel(6);
        Mockito.when(userService.getUserById(TEST_PROCESS_DEFINITION_CREATE_USER)).thenReturn(userC);

        File file = new File("src/main/resources/json/ut-definition.json");
        CharsetEncoder encoder = Charset.forName("UTF-8").newEncoder();
        JSON json = JSONUtil.readJSON(file, encoder.charset());
        ProcDefModel procDefModel = json.toBean(ProcDefModel.class, true);
        ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
        this.PROCESS_DEFINITION_ID = processDefinitionService.deployProcess(processDeploymentDTO, "new", TEST_PROCESS_DEFINITION_CREATE_USER);
    }

    @Test
    @DisplayName("通过流程定义key获取流程定义模型")
    public void getProcessDefModelByKey(){
        ProcDefModel defModel = processModelService.getProcessDefModelByKey(PROCESS_DEFINITION_KEY, TENANT_ID);
        Assertions.assertNotNull(defModel);
    }

    @Test
    @DisplayName("通过流程定义Id获取流程定义模型")
    public void getBpmnModelByProcDefId(){
        BpmnModel model = processModelService.getBpmnModelByProcDefId(PROCESS_DEFINITION_ID);
        Assertions.assertNotNull(model);
    }

}
