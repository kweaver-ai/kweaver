package com.aishu.wf.core.engine.core.cmd;

import java.io.Serializable;

import org.activiti.engine.impl.interceptor.Command;
import org.activiti.engine.impl.interceptor.CommandContext;
import org.activiti.engine.impl.persistence.deploy.DeploymentCache;
import org.activiti.engine.impl.persistence.deploy.DeploymentManager;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;

/**
 * 刷新流程定义缓存
 *
 * @author lw
 */
public class RefreshProcessDefineCacheCmd implements Command<Void>, Serializable {

    private static final long serialVersionUID = 1L;
    protected String processDefinitionId;

    public RefreshProcessDefineCacheCmd(String processDefinitionId) {
        this.processDefinitionId = processDefinitionId;
    }

    @Override
    public Void execute(CommandContext commandContext) {
        if (processDefinitionId == null) {
            return null;
        }
        DeploymentManager deploymentManager = commandContext.getProcessEngineConfiguration().getDeploymentManager();
        DeploymentCache<ProcessDefinitionEntity> pdfCache = deploymentManager.getProcessDefinitionCache();
        //将processDefinitionId的实例从流程定义缓存中删除
        pdfCache.remove(processDefinitionId);
        //重新新增processDefinitionId的实例到流程定义缓存中
        deploymentManager.findDeployedProcessDefinitionById(processDefinitionId);
        return null;
    }

}
