package com.aishu.wf.core.engine.core.service.impl;

import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.common.config.CustomConfig;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.identity.model.User;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.RepositoryService;
import org.activiti.engine.impl.persistence.deploy.DeploymentCache;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.repository.ProcessDefinition;
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

@Slf4j
@ActiveProfiles("ut")
@ComponentScan(basePackages = {"com.**", "org.activiti.**"})
@SpringBootTest(classes = WorkflowCodeApplication.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("流程定义服务单元测试类")
@Transactional
public class ProcessDefinitionServiceImplTest {
    @Autowired
    protected RepositoryService repositoryService;

    @InjectMocks
    @Autowired
    private ProcessDefinitionService processDefinitionService = new ProcessDefinitionServiceImpl();

    @Autowired
    private ProcessInstanceService processInstanceService;

    @Autowired
    protected DeploymentCache<ProcessDefinitionEntity> processDefinitionCache;

    @Autowired
    private CustomConfig customConfig;

    @InjectMocks
    @Autowired
    private ProcessModelServiceImpl processModelService;;

    @InjectMocks
    @Autowired
    private ProcessInfoConfigManager processInfoConfigManager;

    @Mock
    private UserService userService;

    private final static String TEST_PROCESS_DEFINITION_ID_PREFIX = "TestProcessDefinitionProcess:";
    private final static String TEST_PROCESS_DEFINITION_NAME_PREFIX = "测试流程定义名称:";
    private static String PROCESS_DEFINITION_ID = "";

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
    public void beforeEach() {
        User userC = new User();
        userC.setCsfLevel(6);
        Mockito.when(userService.getUserById(TEST_PROCESS_DEFINITION_CREATE_USER)).thenReturn(userC);

        File file = new File("src/main/resources/json/ut-definition.json");
        CharsetEncoder encoder = Charset.forName("UTF-8").newEncoder();
        cn.hutool.json.JSON json = JSONUtil.readJSON(file, encoder.charset());
        ProcDefModel procDefModel = json.toBean(ProcDefModel.class, true);
        ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
        this.PROCESS_DEFINITION_ID = processDefinitionService.deployProcess(processDeploymentDTO, "new", TEST_PROCESS_DEFINITION_CREATE_USER);
    }

    @AfterEach
    public void afterEach() {
        log.info("afterEach execute");
    }

    @Test
    @DisplayName("获取流程定义列表")
    public void findProcessDefinitionList() {
        ProcessDefinitionDTO queryDTO = new ProcessDefinitionDTO();
        queryDTO.setPageNumber(1);
        queryDTO.setPageSize(10);
        IPage<ProcessInfoConfig> page = processDefinitionService.findProcessDefinitionList(queryDTO, "");
        Assertions.assertNotNull(page);
        Assertions.assertEquals(10, page.getRecords().size());
    }


    @Test
    @DisplayName("获取流程实例变量")
    public void getProcessInstanceVariables() {
        Object obj=processInstanceService.getProcessInstanceVariables("fa8d9c41-a3d8-11eb-a67d-e2d464bea7a3","wf_preTaskDefKey");
        Assertions.assertNotNull(obj);
    }

    @Test
    @DisplayName("部署流程")
    public void deployProcess() {
        String procDefModelJsonString = "{\"tenantId\":\"as_workflow\",\"key\":\"Process_42WPZHM1\",\"flowXml\":\"JTNDP3htbCUyMHZlcnNpb249JTIyMS4wJTIyJTIwZW5jb2Rpbmc9JTIyVVRGLTglMjI/JTNFJTBBJTNDZGVmaW5pdGlvbnMlMjB4bWxucz0lMjJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9CUE1OLzIwMTAwNTI0L01PREVMJTIyJTIweG1sbnM6eHNpPSUyMmh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlJTIyJTIweG1sbnM6YnBtbmRpPSUyMmh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0JQTU4vMjAxMDA1MjQvREklMjIlMjB4bWxuczpvbWdkYz0lMjJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9ERC8yMDEwMDUyNC9EQyUyMiUyMHhtbG5zOmRpPSUyMmh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0RELzIwMTAwNTI0L0RJJTIyJTIweG1sbnM6YWN0aXZpdGk9JTIyaHR0cDovL2FjdGl2aXRpLm9yZy9icG1uJTIyJTIweG1sbnM6eHNkPSUyMmh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hJTIyJTIwdGFyZ2V0TmFtZXNwYWNlPSUyMmh0dHA6Ly93d3cuYWN0aXZpdGkub3JnL3Rlc3QlMjIlM0UlMEElMjAlMjAlM0Nwcm9jZXNzJTIwaWQ9JTIyUHJvY2Vzc180MldQWkhNMSUyMiUyMG5hbWU9JTIyd3d3ZWVlJTIyJTIwaXNFeGVjdXRhYmxlPSUyMnRydWUlMjIlM0UlMEElMjAlMjAlMjAlMjAlM0NzdGFydEV2ZW50JTIwaWQ9JTIyc2lkLTQ2NTg4RUFBLTM4QjctNEZCQy04MERELTQ2QTVFRkUyNkNGQSUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ291dGdvaW5nJTNFU2VxdWVuY2VGbG93XzBqZmVuZHclM0Mvb3V0Z29pbmclM0UlMEElMjAlMjAlMjAlMjAlM0Mvc3RhcnRFdmVudCUzRSUwQSUyMCUyMCUyMCUyMCUzQ3VzZXJUYXNrJTIwaWQ9JTIyVXNlclRhc2tfMHp6NmxjdyUyMiUyMG5hbWU9JTIyJUU1JUFFJUExJUU2JUEwJUI4JTIyJTIwYWN0aXZpdGk6YXNzaWduZWU9JTIyJCU3QmFzc2lnbmVlJTdEJTIyJTIwYWN0aXZpdGk6Y2FuZGlkYXRlVXNlcnM9JTIyMTgzYTNiNjAtNzVhMC0xMWViLTk5MzktMDgwMDI3ZTZjMTZjJTIyJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDZXh0ZW5zaW9uRWxlbWVudHMlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NhY3Rpdml0aTpleHBhbmRQcm9wZXJ0eSUyMGlkPSUyMmRlYWxUeXBlJTIyJTIwdmFsdWU9JTIydGpzaCUyMiUyMC8lM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0MvZXh0ZW5zaW9uRWxlbWVudHMlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NpbmNvbWluZyUzRVNlcXVlbmNlRmxvd18wamZlbmR3JTNDL2luY29taW5nJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDb3V0Z29pbmclM0VTZXF1ZW5jZUZsb3dfMDhxY3lieSUzQy9vdXRnb2luZyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ211bHRpSW5zdGFuY2VMb29wQ2hhcmFjdGVyaXN0aWNzJTIwaXNTZXF1ZW50aWFsPSUyMmZhbHNlJTIyJTIwYWN0aXZpdGk6Y29sbGVjdGlvbj0lMjIkJTdCYXNzaWduZWVMaXN0JTdEJTIyJTIwYWN0aXZpdGk6ZWxlbWVudFZhcmlhYmxlPSUyMmFzc2lnbmVlJTIyJTIwLyUzRSUwQSUyMCUyMCUyMCUyMCUzQy91c2VyVGFzayUzRSUwQSUyMCUyMCUyMCUyMCUzQ2VuZEV2ZW50JTIwaWQ9JTIyRW5kRXZlbnRfMXdxZ2lwcCUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ2luY29taW5nJTNFU2VxdWVuY2VGbG93XzA4cWN5YnklM0MvaW5jb21pbmclM0UlMEElMjAlMjAlMjAlMjAlM0MvZW5kRXZlbnQlM0UlMEElMjAlMjAlMjAlMjAlM0NzZXF1ZW5jZUZsb3clMjBpZD0lMjJTZXF1ZW5jZUZsb3dfMGpmZW5kdyUyMiUyMHNvdXJjZVJlZj0lMjJzaWQtNDY1ODhFQUEtMzhCNy00RkJDLTgwREQtNDZBNUVGRTI2Q0ZBJTIyJTIwdGFyZ2V0UmVmPSUyMlVzZXJUYXNrXzB6ejZsY3clMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTNDc2VxdWVuY2VGbG93JTIwaWQ9JTIyU2VxdWVuY2VGbG93XzA4cWN5YnklMjIlMjBzb3VyY2VSZWY9JTIyVXNlclRhc2tfMHp6NmxjdyUyMiUyMHRhcmdldFJlZj0lMjJFbmRFdmVudF8xd3FnaXBwJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9wcm9jZXNzJTNFJTBBJTIwJTIwJTNDYnBtbmRpOkJQTU5EaWFncmFtJTIwaWQ9JTIyQlBNTkRpYWdyYW1fZGVtb196ZGh0YTY5NjY2MzMzNjYlMjIlM0UlMEElMjAlMjAlMjAlMjAlM0NicG1uZGk6QlBNTlBsYW5lJTIwaWQ9JTIyQlBNTlBsYW5lX2RlbW9femRodGE2OTY2NjMzMzY2JTIyJTIwYnBtbkVsZW1lbnQ9JTIyUHJvY2Vzc180MldQWkhNMSUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ2JwbW5kaTpCUE1OU2hhcGUlMjBpZD0lMjJCUE1OU2hhcGVfc2lkLTQ2NTg4RUFBLTM4QjctNEZCQy04MERELTQ2QTVFRkUyNkNGQSUyMiUyMGJwbW5FbGVtZW50PSUyMnNpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkElMjIlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NvbWdkYzpCb3VuZHMlMjB4PSUyMjQyNSUyMiUyMHk9JTIyMTM1JTIyJTIwd2lkdGg9JTIyMzAlMjIlMjBoZWlnaHQ9JTIyMzAlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDL2JwbW5kaTpCUE1OU2hhcGUlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NicG1uZGk6QlBNTlNoYXBlJTIwaWQ9JTIyVXNlclRhc2tfMHp6Nmxjd19kaSUyMiUyMGJwbW5FbGVtZW50PSUyMlVzZXJUYXNrXzB6ejZsY3clMjIlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NvbWdkYzpCb3VuZHMlMjB4PSUyMjU4MCUyMiUyMHk9JTIyMTEwJTIyJTIwd2lkdGg9JTIyMTAwJTIyJTIwaGVpZ2h0PSUyMjgwJTIyJTIwLyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQy9icG1uZGk6QlBNTlNoYXBlJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDYnBtbmRpOkJQTU5TaGFwZSUyMGlkPSUyMkVuZEV2ZW50XzF3cWdpcHBfZGklMjIlMjBicG1uRWxlbWVudD0lMjJFbmRFdmVudF8xd3FnaXBwJTIyJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDb21nZGM6Qm91bmRzJTIweD0lMjI3NzIlMjIlMjB5PSUyMjEzMiUyMiUyMHdpZHRoPSUyMjM2JTIyJTIwaGVpZ2h0PSUyMjM2JTIyJTIwLyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQy9icG1uZGk6QlBNTlNoYXBlJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDYnBtbmRpOkJQTU5FZGdlJTIwaWQ9JTIyU2VxdWVuY2VGbG93XzBqZmVuZHdfZGklMjIlMjBicG1uRWxlbWVudD0lMjJTZXF1ZW5jZUZsb3dfMGpmZW5kdyUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2RpOndheXBvaW50JTIweD0lMjI0NTUlMjIlMjB5PSUyMjE1MCUyMiUyMC8lM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NkaTp3YXlwb2ludCUyMHg9JTIyNTgwJTIyJTIweT0lMjIxNTAlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDL2JwbW5kaTpCUE1ORWRnZSUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ2JwbW5kaTpCUE1ORWRnZSUyMGlkPSUyMlNlcXVlbmNlRmxvd18wOHFjeWJ5X2RpJTIyJTIwYnBtbkVsZW1lbnQ9JTIyU2VxdWVuY2VGbG93XzA4cWN5YnklMjIlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NkaTp3YXlwb2ludCUyMHg9JTIyNjgwJTIyJTIweT0lMjIxNTAlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDZGk6d2F5cG9pbnQlMjB4PSUyMjc3MiUyMiUyMHk9JTIyMTUwJTIyJTIwLyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQy9icG1uZGk6QlBNTkVkZ2UlM0UlMEElMjAlMjAlMjAlMjAlM0MvYnBtbmRpOkJQTU5QbGFuZSUzRSUwQSUyMCUyMCUzQy9icG1uZGk6QlBNTkRpYWdyYW0lM0UlMEElM0MvZGVmaW5pdGlvbnMlM0UlMEE=\",\"name\":\"wwweee\",\"type\":\"doc_sync\",\"typeName\":\"文档同步审核\",\"docShareStrategyList\":[]}";
        ProcDefModel procDefModel = JSON.parseObject(procDefModelJsonString, ProcDefModel.class);
        ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
        String procDefId = processDefinitionService.deployProcess(processDeploymentDTO, "new", TEST_PROCESS_DEFINITION_CREATE_USER);
        Assertions.assertNotNull(procDefId);
        ProcDefModel procDefModel2 = JSON.parseObject(procDefModelJsonString, ProcDefModel.class);
        procDefModel2.setName("");
        ProcessDeploymentDTO processDeploymentDTO2 = ProcessDeploymentDTO.builder(procDefModel2);
        Throwable exception1 = Assertions.assertThrows(IllegalArgumentException.class, () -> processDefinitionService.deployProcess(processDeploymentDTO2, "new", TEST_PROCESS_DEFINITION_CREATE_USER));
        String errorMsg2 = String.format("[%s]流程部署失败,错误信息:[%s]", procDefModel2.getKey(), "保存流程失败，参数为空");
        Assertions.assertEquals(errorMsg2, exception1.getLocalizedMessage());
        ProcDefModel procDefModel3 = JSON.parseObject(procDefModelJsonString, ProcDefModel.class);
        procDefModel3.setFlowXml("JTNDP3htbCUyMHZlcnNpb249JTIyMS4wJTIyJTIwZW5jb2Rpbmc9JTIyVVRGLTglMjI/JTNFJTBBJTNDZGVmaW5pdGlvbnMlMjB4bWxucz0lMjJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9CUE1OLzIwMTAwNTI0L01PREVMJTIyJTIweG1sbnM6eHNpPSUyMmh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlJTIyJTIweG1sbnM6YnBtbmRpPSUyMmh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0JQTU4vMjAxMDA1MjQvREklMjIlMjB4bWxuczpvbWdkYz0lMjJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9ERC8yMDEwMDUyNC9EQyUyMiUyMHhtbG5zOmRpPSUyMmh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0RELzIwMTAwNTI0L0RJJTIyJTIweG1sbnM6YWN0aXZpdGk9JTIyaHR0cDovL2FjdGl2aXRpLm9yZy9icG1uJTIyJTIweG1sbnM6eHNkPSUyMmh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hJTIyJTIwdGFyZ2V0TmFtZXNwYWNlPSUyMmh0dHA6Ly93d3cuYWN0aXZpdGkub3JnL3Rlc3QlMjIlM0UlMEElMjAlMjAlM0Nwcm9jZXNzJTIwaWQ9JTIyUHJvY2Vzc19KTUFPNkZERSUyMiUyMG5hbWU9JTIyVGVzdCVFNiVCNSU4QiVFOCVBRiU5NSVFNiU5NiVCMCVFNSVCQiVCQSVFNiVCNSU4MSVFNyVBOCU4QiUyMiUyMGlzRXhlY3V0YWJsZT0lMjJ0cnVlJTIyJTNFJTBBJTIwJTIwJTIwJTIwJTNDc3RhcnRFdmVudCUyMGlkPSUyMnNpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkElMjIlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NvdXRnb2luZyUzRVNlcXVlbmNlRmxvd18wamZlbmR3JTNDL291dGdvaW5nJTNFJTBBJTIwJTIwJTIwJTIwJTNDL3N0YXJ0RXZlbnQlM0UlMEElMjAlMjAlMjAlMjAlM0N1c2VyVGFzayUyMGlkPSUyMlVzZXJUYXNrXzB6ejZsY3clMjIlMjBuYW1lPSUyMiVFNSVBRSVBMSVFNiVBMCVCOCUyMiUyMGFjdGl2aXRpOmNhbmRpZGF0ZVVzZXJzPSUyMjllNGU3ZWJjLTYyMWEtMTFlYi05MzVmLTA4MDAyN2U2YzE2Yyw3ZDEyYzFiMC03NWI5LTExZWItOTkzOS0wODAwMjdlNmMxNmMlMjIlMjBhY3Rpdml0aTphc3NpZ25lZT0lMjIkJTdCYXNzaWduZWUlN0QlMjIlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NleHRlbnNpb25FbGVtZW50cyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2FjdGl2aXRpOmV4cGFuZFByb3BlcnR5JTIwaWQ9JTIyZGVhbFR5cGUlMjIlMjB2YWx1ZT0lMjJ0anNoJTIyJTIwLyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQy9leHRlbnNpb25FbGVtZW50cyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ2luY29taW5nJTNFU2VxdWVuY2VGbG93XzBqZmVuZHclM0MvaW5jb21pbmclM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NvdXRnb2luZyUzRVNlcXVlbmNlRmxvd18wOHFjeWJ5JTNDL291dGdvaW5nJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDbXVsdGlJbnN0YW5jZUxvb3BDaGFyYWN0ZXJpc3RpY3MlMjBpc1NlcXVlbnRpYWw9JTIyZmFsc2UlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTNDL3VzZXJUYXNrJTNFJTBBJTIwJTIwJTIwJTIwJTNDZW5kRXZlbnQlMjBpZD0lMjJFbmRFdmVudF8xd3FnaXBwJTIyJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDaW5jb21pbmclM0VTZXF1ZW5jZUZsb3dfMDhxY3lieSUzQy9pbmNvbWluZyUzRSUwQSUyMCUyMCUyMCUyMCUzQy9lbmRFdmVudCUzRSUwQSUyMCUyMCUyMCUyMCUzQ3NlcXVlbmNlRmxvdyUyMGlkPSUyMlNlcXVlbmNlRmxvd18wamZlbmR3JTIyJTIwc291cmNlUmVmPSUyMnNpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkElMjIlMjB0YXJnZXRSZWY9JTIyVXNlclRhc2tfMHp6NmxjdyUyMiUyMC8lM0UlMEElMjAlMjAlMjAlMjAlM0NzZXF1ZW5jZUZsb3clMjBpZD0lMjJTZXF1ZW5jZUZsb3dfMDhxY3lieSUyMiUyMHNvdXJjZVJlZj0lMjJVc2VyVGFza18weno2bGN3JTIyJTIwdGFyZ2V0UmVmPSUyMkVuZEV2ZW50XzF3cWdpcHAlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL3Byb2Nlc3MlM0UlMEElMjAlMjAlM0NicG1uZGk6QlBNTkRpYWdyYW0lMjBpZD0lMjJCUE1ORGlhZ3JhbV9kZW1vX3pkaHRhNjk2NjYzMzM2NiUyMiUzRSUwQSUyMCUyMCUyMCUyMCUzQ2JwbW5kaTpCUE1OUGxhbmUlMjBpZD0lMjJCUE1OUGxhbmVfZGVtb196ZGh0YTY5NjY2MzMzNjYlMjIlMjBicG1uRWxlbWVudD0lMjJQcm9jZXNzX0pNQU82RkRFJTIyJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDYnBtbmRpOkJQTU5TaGFwZSUyMGlkPSUyMkJQTU5TaGFwZV9zaWQtNDY1ODhFQUEtMzhCNy00RkJDLTgwREQtNDZBNUVGRTI2Q0ZBJTIyJTIwYnBtbkVsZW1lbnQ9JTIyc2lkLTQ2NTg4RUFBLTM4QjctNEZCQy04MERELTQ2QTVFRkUyNkNGQSUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ29tZ2RjOkJvdW5kcyUyMHg9JTIyNDI1JTIyJTIweT0lMjIxMzUlMjIlMjB3aWR0aD0lMjIzMCUyMiUyMGhlaWdodD0lMjIzMCUyMiUyMC8lM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0MvYnBtbmRpOkJQTU5TaGFwZSUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUzQ2JwbW5kaTpCUE1OU2hhcGUlMjBpZD0lMjJVc2VyVGFza18weno2bGN3X2RpJTIyJTIwYnBtbkVsZW1lbnQ9JTIyVXNlclRhc2tfMHp6NmxjdyUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ29tZ2RjOkJvdW5kcyUyMHg9JTIyNTgwJTIyJTIweT0lMjIxMTAlMjIlMjB3aWR0aD0lMjIxMDAlMjIlMjBoZWlnaHQ9JTIyODAlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDL2JwbW5kaTpCUE1OU2hhcGUlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NicG1uZGk6QlBNTlNoYXBlJTIwaWQ9JTIyRW5kRXZlbnRfMXdxZ2lwcF9kaSUyMiUyMGJwbW5FbGVtZW50PSUyMkVuZEV2ZW50XzF3cWdpcHAlMjIlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NvbWdkYzpCb3VuZHMlMjB4PSUyMjc3MiUyMiUyMHk9JTIyMTMyJTIyJTIwd2lkdGg9JTIyMzYlMjIlMjBoZWlnaHQ9JTIyMzYlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDL2JwbW5kaTpCUE1OU2hhcGUlM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0NicG1uZGk6QlBNTkVkZ2UlMjBpZD0lMjJTZXF1ZW5jZUZsb3dfMGpmZW5kd19kaSUyMiUyMGJwbW5FbGVtZW50PSUyMlNlcXVlbmNlRmxvd18wamZlbmR3JTIyJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDZGk6d2F5cG9pbnQlMjB4PSUyMjQ1NSUyMiUyMHk9JTIyMTUwJTIyJTIwLyUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2RpOndheXBvaW50JTIweD0lMjI1ODAlMjIlMjB5PSUyMjE1MCUyMiUyMC8lM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlM0MvYnBtbmRpOkJQTU5FZGdlJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDYnBtbmRpOkJQTU5FZGdlJTIwaWQ9JTIyU2VxdWVuY2VGbG93XzA4cWN5YnlfZGklMjIlMjBicG1uRWxlbWVudD0lMjJTZXF1ZW5jZUZsb3dfMDhxY3lieSUyMiUzRSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2RpOndheXBvaW50JTIweD0lMjI2ODAlMjIlMjB5PSUyMjE1MCUyMiUyMC8lM0UlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NkaTp3YXlwb2ludCUyMHg9JTIyNzcyJTIyJTIweT0lMjIxNTAlMjIlMjAvJTNFJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTNDL2JwbW5kaTpCUE1ORWRnZSUzRSUwQSUyMCUyMCUyMCUyMCUzQy9icG1uZGk6QlBNTlBsYW5lJTNFJTBBJTIwJTIwJTNDL2JwbW5kaTpCUE1ORGlhZ3JhbSUzRSUwQSUzQy9kZWZpbml0aW9ucyUzRQ==");
        ProcessDeploymentDTO processDeploymentDTO3 = ProcessDeploymentDTO.builder(procDefModel3);
        Throwable exception3 = Assertions.assertThrows(IllegalArgumentException.class, () -> processDefinitionService.deployProcess(processDeploymentDTO3, "new", TEST_PROCESS_DEFINITION_CREATE_USER));
        String localizedMessage3 = exception3.getLocalizedMessage();
        Assertions.assertTrue(localizedMessage3.contains("验证流程建模异常"));
        ProcDefModel procDefModel5 = JSON.parseObject(procDefModelJsonString, ProcDefModel.class);
        ProcessDeploymentDTO processDeploymentDTO5 = ProcessDeploymentDTO.builder(procDefModel5);
        Throwable exception5 = Assertions.assertThrows(IllegalArgumentException.class, () -> processDefinitionService.deployProcess(processDeploymentDTO5, "update4", TEST_PROCESS_DEFINITION_CREATE_USER));
        String errorMsg5 = String.format("[%s]流程部署失败,错误信息:[%s]", procDefModel5.getKey(), "opType[update4]错误");
        Assertions.assertEquals(errorMsg5, exception5.getLocalizedMessage());
    }

    @Test
    @DisplayName("获取流程定义")
    public void getProcessDefinition() {
        ProcessDefinition processDefinition=repositoryService.getProcessDefinition(PROCESS_DEFINITION_ID);
        Assertions.assertNotNull(processDefinition);
    }

    @Test
    @DisplayName("判断流程是否存在")
    public void exists() {
        String processDefName = "springboot-junit-test-123456";
        String processTypeId1 = "tjsh";
        Boolean exists1 = processDefinitionService.exists(processDefName, processTypeId1, customConfig.getTenantId());
        Assertions.assertNotNull(exists1);
        Assertions.assertEquals(false, exists1);
        String processTypeId2 = "zjsh";
        Boolean exists2 = processDefinitionService.exists(processDefName, processTypeId2, customConfig.getTenantId());
        Assertions.assertNotNull(exists2);
        Assertions.assertEquals(false, exists1);
        String processTypeId3 = "hqsh";
        Boolean exists3 = processDefinitionService.exists(processDefName, processTypeId3, customConfig.getTenantId());
        Assertions.assertNotNull(exists3);
        Assertions.assertEquals(false, exists1);
    }

    /*@Test
    @Order(6)
    @DisplayName("获取环节定义信息")
    public void getActivityDefinitionModel() {
        String actDefId = "UserTask_0zz6lcw";
        AtomicReference<ActivityDefinitionModel> actDefModel = new AtomicReference<>();
        ActivityDefinitionModel model = processDefinitionService.getActivityDefinitionModel(PROCESS_DEFINITION_ID, actDefId);
        Assertions.assertNotNull(model);
        Assertions.assertNull(actDefModel.get());
    }*/

    @Test
    @DisplayName("删除流程定义")
    public void deleteProcess() {
        String procDefId = TEST_PROCESS_DEFINITION_ID_PREFIX + 2;
        boolean isCascade = true;
        Boolean deleteFlag = processDefinitionService.deleteProcess(procDefId, isCascade);
        Assertions.assertFalse(deleteFlag);
    }



}