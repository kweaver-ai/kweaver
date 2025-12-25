package com.aishu.wf.core.engine.core.service.impl;

import cn.hutool.json.JSON;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.baomidou.mybatisplus.core.metadata.IPage;
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
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/4/26 19:04
 */
@DisplayName("流程管理配置服务单元测试类")
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Transactional
public class ProcessConfigServiceImplTest {

    @InjectMocks
    @Autowired
    private ProcessDefinitionService processDefinitionService = new ProcessDefinitionServiceImpl();

    @InjectMocks
    @Autowired
    private ProcessModelServiceImpl processModelService;

    @InjectMocks
    @Autowired
    private ProcessInfoConfigManager processInfoConfigManager;

    @InjectMocks
    @Autowired
    private ProcessConfigService processConfigService = new ProcessConfigServiceImpl();

    @Mock
    private UserService userService;

    private static String PROCESS_DEFINITION_ID = "";

    private final static String actDefId = "UserTask_0zz6lcw";

    private final static String USER_ID = "p_ouyangfeng";

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
        Mockito.when(userService.getUserById(USER_ID)).thenReturn(userC);

        File file = new File("src/main/resources/json/ut-definition.json");
        CharsetEncoder encoder = Charset.forName("UTF-8").newEncoder();
        JSON json = JSONUtil.readJSON(file, encoder.charset());
        ProcDefModel procDefModel = json.toBean(ProcDefModel.class, true);
        ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
        this.PROCESS_DEFINITION_ID = processDefinitionService.deployProcess(processDeploymentDTO, "new", USER_ID);
    }

    @Test
    @DisplayName("获取流程绑定的界面路径")
    public void getWorkflowPage(){
        String result = processConfigService.getWorkflowPage(PROCESS_DEFINITION_ID, actDefId);
        Assertions.assertNotNull(result);
    }

    @Test
    @DisplayName("获取流程配置分页")
    public void findProcessInfoConfigsPage(){
        ProcessInfoConfig params = new ProcessInfoConfig();
        ProcessDefinitionDTO queryDTO = new ProcessDefinitionDTO();
        params.setProcessDefId(PROCESS_DEFINITION_ID);
        queryDTO.setPageNumber(1);
        queryDTO.setPageSize(10);
        IPage<ProcessInfoConfig> page = processConfigService.findProcessInfoConfigsPage(queryDTO, params);
        Assertions.assertTrue(page.getTotal()>0);
    }

    @Test
    @DisplayName("获取流程配置列表")
    public void findProcessInfoConfigs(){
        ProcessInfoConfig params = new ProcessInfoConfig();
        params.setProcessDefId(PROCESS_DEFINITION_ID);
        List<ProcessInfoConfig> list = processConfigService.findProcessInfoConfigs(params);
        Assertions.assertNotNull(list);
    }

    @Test
    @DisplayName("获取环节信息")
    public void getActivityInfoConfig(){
        ActivityInfoConfig config = processConfigService.getActivityInfoConfig(PROCESS_DEFINITION_ID, actDefId);
        Assertions.assertNotNull(config);
    }

    @Test
    @DisplayName("获取流程配置")
    public void getProcessInfoConfig(){
        ProcessInfoConfig config = processConfigService.getProcessInfoConfig(PROCESS_DEFINITION_ID);
        Assertions.assertNotNull(config);
    }

    @Test
    @DisplayName("删除流程配置")
    public void deleteProcessInfoConfig(){
        boolean result = processConfigService.deleteProcessInfoConfig(PROCESS_DEFINITION_ID);
        Assertions.assertTrue(result);
    }

    @Test
    @DisplayName("判断是否流程贯彻流程")
    public void isThroughBizAppProcess(){
        boolean result = processConfigService.isThroughBizAppProcess(PROCESS_DEFINITION_ID, actDefId);
        Assertions.assertFalse(result);
    }
}
