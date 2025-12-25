package com.aishu.wf.api.config;

import com.aishu.wf.core.common.config.CustomConfig;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.RedisLockUtil;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Date;

/**
 * @description 初始化文档共享流程
 * @author hanj
 */
@Slf4j
@Order(value = 3)
@Component
public class InitDocShareProcess implements ApplicationRunner {

    @Resource
    private ProcessDefinitionService processDefinitionService;

    @Autowired
    private CustomConfig customConfig;

    @Autowired
    private RedisLockUtil redisLock;

    private static long TIMEOUT = 60;

    private final static String RENAME_PROC_DEF_MODEL_JSON = "{\"procDefId\":\"Process_SHARE001:5:1972be24-beda-11eb-b314-ba08cfd26d9c\",\"key\":\"Process_SHARE001\",\"name\":\"实名共享审核工作流\",\"tenantId\":\"as_workflow\",\"flowXml\":\"PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPGRlZmluaXRpb25zIHhtbG5zPSJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9CUE1OLzIwMTAwNTI0L01PREVMIiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4bWxuczpicG1uZGk9Imh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0JQTU4vMjAxMDA1MjQvREkiIHhtbG5zOm9tZ2RjPSJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9ERC8yMDEwMDUyNC9EQyIgeG1sbnM6ZGk9Imh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0RELzIwMTAwNTI0L0RJIiB4bWxuczphY3Rpdml0aT0iaHR0cDovL2FjdGl2aXRpLm9yZy9icG1uIiB4bWxuczp4c2Q9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hIiB0YXJnZXROYW1lc3BhY2U9Imh0dHA6Ly93d3cuYWN0aXZpdGkub3JnL3Rlc3QiPgogIDxwcm9jZXNzIGlkPSJQcm9jZXNzX1NIQVJFMDAxIiBuYW1lPSLlrp7lkI3lhbHkuqvlrqHmoLjlt6XkvZzmtYEiIGlzRXhlY3V0YWJsZT0idHJ1ZSI+CiAgICA8c3RhcnRFdmVudCBpZD0ic2lkLTQ2NTg4RUFBLTM4QjctNEZCQy04MERELTQ2QTVFRkUyNkNGQSIgbmFtZT0i5Y+R6LW3Ij4KICAgICAgPG91dGdvaW5nPlNlcXVlbmNlRmxvd18wamZlbmR3PC9vdXRnb2luZz4KICAgIDwvc3RhcnRFdmVudD4KICAgIDx1c2VyVGFzayBpZD0iVXNlclRhc2tfMHp6NmxjdyIgbmFtZT0i5a6h5qC4IiBhY3Rpdml0aTphc3NpZ25lZT0iJHthc3NpZ25lZX0iIGFjdGl2aXRpOmNhbmRpZGF0ZVVzZXJzPSIiPgogICAgICA8ZXh0ZW5zaW9uRWxlbWVudHM+CiAgICAgICAgPGFjdGl2aXRpOmV4cGFuZFByb3BlcnR5IGlkPSJkZWFsVHlwZSIgdmFsdWU9InRqc2giIC8+CiAgICAgIDwvZXh0ZW5zaW9uRWxlbWVudHM+CiAgICAgIDxpbmNvbWluZz5TZXF1ZW5jZUZsb3dfMGpmZW5kdzwvaW5jb21pbmc+CiAgICAgIDxvdXRnb2luZz5TZXF1ZW5jZUZsb3dfMDhxY3lieTwvb3V0Z29pbmc+CiAgICAgIDxtdWx0aUluc3RhbmNlTG9vcENoYXJhY3RlcmlzdGljcyBpc1NlcXVlbnRpYWw9ImZhbHNlIiBhY3Rpdml0aTpjb2xsZWN0aW9uPSIke2Fzc2lnbmVlTGlzdH0iIGFjdGl2aXRpOmVsZW1lbnRWYXJpYWJsZT0iYXNzaWduZWUiIC8+CiAgICA8L3VzZXJUYXNrPgogICAgPGVuZEV2ZW50IGlkPSJFbmRFdmVudF8xd3FnaXBwIiBuYW1lPSLnu5PmnZ8iPgogICAgICA8aW5jb21pbmc+U2VxdWVuY2VGbG93XzA4cWN5Ynk8L2luY29taW5nPgogICAgPC9lbmRFdmVudD4KICAgIDxzZXF1ZW5jZUZsb3cgaWQ9IlNlcXVlbmNlRmxvd18wamZlbmR3IiBzb3VyY2VSZWY9InNpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkEiIHRhcmdldFJlZj0iVXNlclRhc2tfMHp6NmxjdyIgLz4KICAgIDxzZXF1ZW5jZUZsb3cgaWQ9IlNlcXVlbmNlRmxvd18wOHFjeWJ5IiBzb3VyY2VSZWY9IlVzZXJUYXNrXzB6ejZsY3ciIHRhcmdldFJlZj0iRW5kRXZlbnRfMXdxZ2lwcCIgLz4KICA8L3Byb2Nlc3M+CiAgPGJwbW5kaTpCUE1ORGlhZ3JhbSBpZD0iQlBNTkRpYWdyYW1fZGVtb196ZGh0YTY5NjY2MzMzNjYiPgogICAgPGJwbW5kaTpCUE1OUGxhbmUgaWQ9IkJQTU5QbGFuZV9kZW1vX3pkaHRhNjk2NjYzMzM2NiIgYnBtbkVsZW1lbnQ9IlByb2Nlc3NfU0hBUkUwMDEiPgogICAgICA8YnBtbmRpOkJQTU5TaGFwZSBpZD0iQlBNTlNoYXBlX3NpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkEiIGJwbW5FbGVtZW50PSJzaWQtNDY1ODhFQUEtMzhCNy00RkJDLTgwREQtNDZBNUVGRTI2Q0ZBIj4KICAgICAgICA8b21nZGM6Qm91bmRzIHg9Ii0xNSIgeT0iLTIzNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiAvPgogICAgICAgIDxicG1uZGk6QlBNTkxhYmVsPgogICAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSItMSIgeT0iLTIxNSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjE0IiAvPgogICAgICAgIDwvYnBtbmRpOkJQTU5MYWJlbD4KICAgICAgPC9icG1uZGk6QlBNTlNoYXBlPgogICAgICA8YnBtbmRpOkJQTU5TaGFwZSBpZD0iVXNlclRhc2tfMHp6Nmxjd19kaSIgYnBtbkVsZW1lbnQ9IlVzZXJUYXNrXzB6ejZsY3ciPgogICAgICAgIDxvbWdkYzpCb3VuZHMgeD0iLTYwIiB5PSItNjAiIHdpZHRoPSIxNDAiIGhlaWdodD0iMTAwIiAvPgogICAgICA8L2JwbW5kaTpCUE1OU2hhcGU+CiAgICAgIDxicG1uZGk6QlBNTlNoYXBlIGlkPSJFbmRFdmVudF8xd3FnaXBwX2RpIiBicG1uRWxlbWVudD0iRW5kRXZlbnRfMXdxZ2lwcCI+CiAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSItMTUiIHk9IjE2MiIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiAvPgogICAgICAgIDxicG1uZGk6QlBNTkxhYmVsPgogICAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSItMSIgeT0iMTgwIiB3aWR0aD0iMjIiIGhlaWdodD0iMTQiIC8+CiAgICAgICAgPC9icG1uZGk6QlBNTkxhYmVsPgogICAgICA8L2JwbW5kaTpCUE1OU2hhcGU+CiAgICAgIDxicG1uZGk6QlBNTkVkZ2UgaWQ9IlNlcXVlbmNlRmxvd18wamZlbmR3X2RpIiBicG1uRWxlbWVudD0iU2VxdWVuY2VGbG93XzBqZmVuZHciPgogICAgICAgIDxkaTp3YXlwb2ludCB4PSIxMCIgeT0iLTE4NSIgLz4KICAgICAgICA8ZGk6d2F5cG9pbnQgeD0iMTAiIHk9Ii02MCIgLz4KICAgICAgPC9icG1uZGk6QlBNTkVkZ2U+CiAgICAgIDxicG1uZGk6QlBNTkVkZ2UgaWQ9IlNlcXVlbmNlRmxvd18wOHFjeWJ5X2RpIiBicG1uRWxlbWVudD0iU2VxdWVuY2VGbG93XzA4cWN5YnkiPgogICAgICAgIDxkaTp3YXlwb2ludCB4PSIxMCIgeT0iNDAiIC8+CiAgICAgICAgPGRpOndheXBvaW50IHg9IjEwIiB5PSIxNjAiIC8+CiAgICAgIDwvYnBtbmRpOkJQTU5FZGdlPgogICAgPC9icG1uZGk6QlBNTlBsYW5lPgogIDwvYnBtbmRpOkJQTU5EaWFncmFtPgo8L2RlZmluaXRpb25zPg==\",\"docShareStrategyList\":[],\"type\":\"doc_share\",\"typeName\":\"文档共享审核\",\"description\":null,\"version\":1,\"createUser\":null,\"createUserName\":\"管理员\",\"createTime\":\"2021-03-09T11:48:47.000+00:00\"}";
    private final static String ANONYMOUS_PROC_DEF_MODEL_JSON = "{\"procDefId\":\"Process_SHARE002:5:1873be24-beda-11eb-b314-ba08cfd38a6b\",\"key\":\"Process_SHARE002\",\"name\":\"匿名共享审核工作流\",\"tenantId\":\"as_workflow\",\"flowXml\":\"PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPGRlZmluaXRpb25zIHhtbG5zPSJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9CUE1OLzIwMTAwNTI0L01PREVMIiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4bWxuczpicG1uZGk9Imh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0JQTU4vMjAxMDA1MjQvREkiIHhtbG5zOm9tZ2RjPSJodHRwOi8vd3d3Lm9tZy5vcmcvc3BlYy9ERC8yMDEwMDUyNC9EQyIgeG1sbnM6ZGk9Imh0dHA6Ly93d3cub21nLm9yZy9zcGVjL0RELzIwMTAwNTI0L0RJIiB4bWxuczphY3Rpdml0aT0iaHR0cDovL2FjdGl2aXRpLm9yZy9icG1uIiB4bWxuczp4c2Q9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hIiB0YXJnZXROYW1lc3BhY2U9Imh0dHA6Ly93d3cuYWN0aXZpdGkub3JnL3Rlc3QiPgogIDxwcm9jZXNzIGlkPSJQcm9jZXNzX1NIQVJFMDAyIiBuYW1lPSLljL/lkI3lhbHkuqvlrqHmoLjlt6XkvZzmtYEiIGlzRXhlY3V0YWJsZT0idHJ1ZSI+CiAgICA8c3RhcnRFdmVudCBpZD0ic2lkLTQ2NTg4RUFBLTM4QjctNEZCQy04MERELTQ2QTVFRkUyNkNGQSIgbmFtZT0i5Y+R6LW3Ij4KICAgICAgPG91dGdvaW5nPlNlcXVlbmNlRmxvd18wamZlbmR3PC9vdXRnb2luZz4KICAgIDwvc3RhcnRFdmVudD4KICAgIDx1c2VyVGFzayBpZD0iVXNlclRhc2tfMHp6NmxjdyIgbmFtZT0i5a6h5qC4IiBhY3Rpdml0aTphc3NpZ25lZT0iJHthc3NpZ25lZX0iIGFjdGl2aXRpOmNhbmRpZGF0ZVVzZXJzPSIiPgogICAgICA8ZXh0ZW5zaW9uRWxlbWVudHM+CiAgICAgICAgPGFjdGl2aXRpOmV4cGFuZFByb3BlcnR5IGlkPSJkZWFsVHlwZSIgdmFsdWU9InRqc2giIC8+CiAgICAgIDwvZXh0ZW5zaW9uRWxlbWVudHM+CiAgICAgIDxpbmNvbWluZz5TZXF1ZW5jZUZsb3dfMGpmZW5kdzwvaW5jb21pbmc+CiAgICAgIDxvdXRnb2luZz5TZXF1ZW5jZUZsb3dfMDhxY3lieTwvb3V0Z29pbmc+CiAgICAgIDxtdWx0aUluc3RhbmNlTG9vcENoYXJhY3RlcmlzdGljcyBpc1NlcXVlbnRpYWw9ImZhbHNlIiBhY3Rpdml0aTpjb2xsZWN0aW9uPSIke2Fzc2lnbmVlTGlzdH0iIGFjdGl2aXRpOmVsZW1lbnRWYXJpYWJsZT0iYXNzaWduZWUiIC8+CiAgICA8L3VzZXJUYXNrPgogICAgPGVuZEV2ZW50IGlkPSJFbmRFdmVudF8xd3FnaXBwIiBuYW1lPSLnu5PmnZ8iPgogICAgICA8aW5jb21pbmc+U2VxdWVuY2VGbG93XzA4cWN5Ynk8L2luY29taW5nPgogICAgPC9lbmRFdmVudD4KICAgIDxzZXF1ZW5jZUZsb3cgaWQ9IlNlcXVlbmNlRmxvd18wamZlbmR3IiBzb3VyY2VSZWY9InNpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkEiIHRhcmdldFJlZj0iVXNlclRhc2tfMHp6NmxjdyIgLz4KICAgIDxzZXF1ZW5jZUZsb3cgaWQ9IlNlcXVlbmNlRmxvd18wOHFjeWJ5IiBzb3VyY2VSZWY9IlVzZXJUYXNrXzB6ejZsY3ciIHRhcmdldFJlZj0iRW5kRXZlbnRfMXdxZ2lwcCIgLz4KICA8L3Byb2Nlc3M+CiAgPGJwbW5kaTpCUE1ORGlhZ3JhbSBpZD0iQlBNTkRpYWdyYW1fZGVtb196ZGh0YTY5NjY2MzMzNjYiPgogICAgPGJwbW5kaTpCUE1OUGxhbmUgaWQ9IkJQTU5QbGFuZV9kZW1vX3pkaHRhNjk2NjYzMzM2NiIgYnBtbkVsZW1lbnQ9IlByb2Nlc3NfU0hBUkUwMDIiPgogICAgICA8YnBtbmRpOkJQTU5TaGFwZSBpZD0iQlBNTlNoYXBlX3NpZC00NjU4OEVBQS0zOEI3LTRGQkMtODBERC00NkE1RUZFMjZDRkEiIGJwbW5FbGVtZW50PSJzaWQtNDY1ODhFQUEtMzhCNy00RkJDLTgwREQtNDZBNUVGRTI2Q0ZBIj4KICAgICAgICA8b21nZGM6Qm91bmRzIHg9Ii0xNSIgeT0iLTIzNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiAvPgogICAgICAgIDxicG1uZGk6QlBNTkxhYmVsPgogICAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSItMSIgeT0iLTIxNSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjE0IiAvPgogICAgICAgIDwvYnBtbmRpOkJQTU5MYWJlbD4KICAgICAgPC9icG1uZGk6QlBNTlNoYXBlPgogICAgICA8YnBtbmRpOkJQTU5TaGFwZSBpZD0iVXNlclRhc2tfMHp6Nmxjd19kaSIgYnBtbkVsZW1lbnQ9IlVzZXJUYXNrXzB6ejZsY3ciPgogICAgICAgIDxvbWdkYzpCb3VuZHMgeD0iLTYwIiB5PSItNjAiIHdpZHRoPSIxNDAiIGhlaWdodD0iMTAwIiAvPgogICAgICA8L2JwbW5kaTpCUE1OU2hhcGU+CiAgICAgIDxicG1uZGk6QlBNTlNoYXBlIGlkPSJFbmRFdmVudF8xd3FnaXBwX2RpIiBicG1uRWxlbWVudD0iRW5kRXZlbnRfMXdxZ2lwcCI+CiAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSItMTUiIHk9IjE2MiIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiAvPgogICAgICAgIDxicG1uZGk6QlBNTkxhYmVsPgogICAgICAgICAgPG9tZ2RjOkJvdW5kcyB4PSItMSIgeT0iMTgwIiB3aWR0aD0iMjIiIGhlaWdodD0iMTQiIC8+CiAgICAgICAgPC9icG1uZGk6QlBNTkxhYmVsPgogICAgICA8L2JwbW5kaTpCUE1OU2hhcGU+CiAgICAgIDxicG1uZGk6QlBNTkVkZ2UgaWQ9IlNlcXVlbmNlRmxvd18wamZlbmR3X2RpIiBicG1uRWxlbWVudD0iU2VxdWVuY2VGbG93XzBqZmVuZHciPgogICAgICAgIDxkaTp3YXlwb2ludCB4PSIxMCIgeT0iLTE4NSIgLz4KICAgICAgICA8ZGk6d2F5cG9pbnQgeD0iMTAiIHk9Ii02MCIgLz4KICAgICAgPC9icG1uZGk6QlBNTkVkZ2U+CiAgICAgIDxicG1uZGk6QlBNTkVkZ2UgaWQ9IlNlcXVlbmNlRmxvd18wOHFjeWJ5X2RpIiBicG1uRWxlbWVudD0iU2VxdWVuY2VGbG93XzA4cWN5YnkiPgogICAgICAgIDxkaTp3YXlwb2ludCB4PSIxMCIgeT0iNDAiIC8+CiAgICAgICAgPGRpOndheXBvaW50IHg9IjEwIiB5PSIxNjAiIC8+CiAgICAgIDwvYnBtbmRpOkJQTU5FZGdlPgogICAgPC9icG1uZGk6QlBNTlBsYW5lPgogIDwvYnBtbmRpOkJQTU5EaWFncmFtPgo8L2RlZmluaXRpb25zPg==\",\"docShareStrategyList\":[],\"type\":\"doc_share\",\"typeName\":\"文档共享审核\",\"description\":null,\"version\":1,\"createUser\":null,\"createUserName\":\"管理员\",\"createTime\":\"2021-03-09T11:48:47.000+00:00\"}";


    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (log.isInfoEnabled()) {
            log.info("文档共享流程初始化监听器正在执行...");
        }

        //上锁
        long time = System.currentTimeMillis();
        boolean result = redisLock.lock("initDocShareProcess", String.valueOf(time), TIMEOUT);
        if (log.isInfoEnabled()) {
            log.info("获得锁的结果：" + result + "；获得锁的时间戳：" + String.valueOf(time));
        }
        if(!result){
            log.info("已存在初始化！！！");
            return;
        }
        try {
            boolean renameExists = processDefinitionService.existsByKey(null, WorkflowConstants.WORKFLOW_TYPE_SHARE,
                    WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY, customConfig.getTenantId());
            if (!renameExists) {
                // 初始化实名共享流程
                try {
                    ProcDefModel procDefModel = JSON.parseObject(RENAME_PROC_DEF_MODEL_JSON, ProcDefModel.class);
                    procDefModel.setCreateTime(new Date());
                    ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
                    processDefinitionService.deployProcess(processDeploymentDTO, "new", "");
                } catch (Exception e) {
                    log.error("文档实名共享流程初始化失败！", e);
                    closeApplication(ApplicationContextHolder.getApplicationContext());
                }
            } else {
                if (log.isInfoEnabled()) {
                    log.info("已存在文档实名共享流程，不需要进行初始化");
                }
            }

            boolean anonymousExists = processDefinitionService.existsByKey(null, WorkflowConstants.WORKFLOW_TYPE_SHARE,
                    WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY, customConfig.getTenantId());
            if (!anonymousExists) {
                // 初始化匿名共享流程
                try {
                    ProcDefModel procDefModel = JSON.parseObject(ANONYMOUS_PROC_DEF_MODEL_JSON, ProcDefModel.class);
                    procDefModel.setCreateTime(new Date());
                    ProcessDeploymentDTO processDeploymentDTO = ProcessDeploymentDTO.builder(procDefModel);
                    processDefinitionService.deployProcess(processDeploymentDTO, "new", "");
                } catch (Exception e) {
                    log.error("文档匿名共享流程初始化失败！", e);
                    closeApplication(ApplicationContextHolder.getApplicationContext());
                }
            } else {
                if (log.isInfoEnabled()) {
                    log.info("已存在文档匿名共享流程，不需要进行初始化");
                }
            }
        } catch (Exception e) {
            log.error("文档共享流程初始化失败！", e);
            closeApplication(ApplicationContextHolder.getApplicationContext());
        } finally {
            //释放锁
            redisLock.unlock("initDocShareProcess", String.valueOf(time));
            if (log.isInfoEnabled()) {
                log.info("释放锁的时间戳" + String.valueOf(time));
            }
        }
    }

    private static void closeApplication(ApplicationContext context) {
        if (context instanceof ConfigurableApplicationContext) {
            ConfigurableApplicationContext closable = (ConfigurableApplicationContext) context;
            closable.close();
        }
    }

}
