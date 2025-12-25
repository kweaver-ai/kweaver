package com.aishu.wf.core.engine.core.service;

import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.activiti.engine.repository.ProcessDefinition;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * @description 流程定义Service
 * @author lw
 */
public interface ProcessDefinitionService extends ActivitiService {

    /**
     * 查询流程定义列表
     *
     * @param queryDTO 查询对象
     * @return
     */
    IPage<ProcessInfoConfig> findProcessDefinitionList(ProcessDefinitionDTO queryDTO, String userId);

    /**
     * @description 查询实名共享流程
     * @author ouandyang
     * @param  tenantId
     * @updateTime 2021/5/20
     */
    ProcessInfoConfig findRenameProcessDefinition(String tenantId);

    ProcessInfoConfig findProcessDefinitionByKey(String key);

    public void processInvalidNotice(String userId);

    public void enableProcessDef(String procDefId);

    void deleteBatchProcessDef(List<String> idList);

    /**
     * 部署流程
     *
     * @param processDeploymentDTO 流程建模定义对象
     * @param opType       操作类型（新建：new，更新：update）
     * @return
     */
    String deployProcess(ProcessDeploymentDTO processDeploymentDTO, String opType, String userId);

    /**
     * 判断流程是否存在
     *
     * @param processDefName 流程建模定义对象
     * @param processTypeId  流程建模定义对象
     * @param tenantId       流程租户ID
     * @return
     */
    Boolean exists(String processDefName, String processTypeId, String tenantId);

    /**
     * @description 根据流程定义key判断流程是否存在
     * @author hanj
     * @param  processDefName
     * @param  processTypeId
     * @param  processDefKey
     * @param  tenantId
     * @updateTime 2021/6/4
     */
    Boolean existsByKey(String processDefName, String processTypeId, String processDefKey, String tenantId);

    /**
     * 删除流程定义
     *
     * @param id        流程定义ID
     * @param isCascade 是否级联删除
     * @return
     */
    Boolean deleteProcess(String id, boolean isCascade);

    /**
     * 获取环节定义信息
     *
     * @param id       流程定义ID
     * @param actDefId 环节定义ID
     */
    ActivityDefinitionModel getActivityDefinitionModel(String id, String actDefId);

    /**
     * 根据流程定义ID查询流程定义对象{@link ProcessDefinition}
     *
     * @param processDefinitionId 流程定义对象ID
     * @return 流程定义对象{@link ProcessDefinition}
     */
    ProcessDefinitionModel getProcessDef(String processDefinitionId);

    /**
     * 获取开始环节
     *
     * @param processDefinitionId
     * @return
     */
    ActivityDefinitionModel getStartActivity(String processDefinitionId);

    /**
     * 获取环节对象
     *
     * @param processDefinitionId
     * @param activityId
     * @return
     */
    ActivityDefinitionModel getActivity(String processDefinitionId,
                                        String activityId);

    /**
     * 获取下一步环节列表
     *
     * @param processInstId
     * @param processDefinitionId
     * @param activityId
     * @param conditionMap
     * @return
     */
    List<ActivityDefinitionModel> getNextActivity(String processInstId, String processDefinitionId,
                                                  String activityId, Map conditionMap);

    /**
     * 获取环节用户列表
     *
     * @param processInstId
     * @param processDefinitionId
     * @param curActivityId
     * @param curActInstId
     * @param destActivityId
     * @param userId
     * @param filterIds
     * @return
     */
    List<ActivityResourceModel> getActivityUserTree(String processInstId, String processDefinitionId,
                                                    String curActInstId, String curActivityId, String destActivityId, String userId, String userOrgId, List<String> filterIds, Map conditionMap);

    /**
     * 获取指定环节绑定资源
     *
     * @param procDefId
     * @param actDefId
     * @return
     */
    List<ActivityResourceModel> getResource(String procDefId, String actDefId);

    /**
     * 查询指定流程定义key下的所有历史版本模型
     *
     * @return
     */
    List<ProcessDefinitionModel> findAllVersionProcessDefs(String procDefkey);

    /**
     * 根据流程定义ID查询流程定义对象{@link ProcessDefinition}
     *
     * @param processDefinitionKey 流程定义对象ID
     * @return 流程定义对象{@link ProcessDefinition}
     */
    ProcessDefinitionModel getProcessDefBykey(String processDefinitionKey, String tenantId);

    ProcessDefinitionModel getProcessDefBykey(String processDefinitionKey);

    /**
     * 根据用户ID查询有权限起草的流程定义列表{@link ProcessDefinition}
     *
     * @param userId 用户ID
     * @return 流程定义对象{@link ProcessDefinition}
     */
    Map<String, List<ProcessDefinitionModel>> findProcessDefStartByUser(String tenantId, String userId, String flowType);

    /**
     * 部署classpath下面的流程定义
     * <p>
     * 从属性配置文件中获取属性<b>com.blueland.bpm.engine.modules</b>扫描**deployments**
     * </p>
     * <p>
     * 然后从每个**deployments/${module}**查找在属性配置文件中的属性**com.blueland.bpm.engine.module.keys.${
     * submodule}**
     * <p>
     * 配置实例：
     *
     * <pre>
     * #com.blueland.bpm.engine for deploy
     * com.blueland.bpm.engine.modules=budget,erp,oa
     * com.blueland.bpm.engine.module.keys.budget=budget
     * com.blueland.bpm.engine.module.keys.erp=acceptInsurance,billing,effectInsurance,endorsement,payment
     * com.blueland.bpm.engine.module.keys.oa=caruse,leave,officalstamp,officesupply,out,overtime
     * </pre>
     *
     * </p>
     *
     * @param processKey 流程定义KEY
     * @throws Exception
     */
    void deployFromClasspath(String exportDir, String... processKey);

    /**
     * 加载流程定义的bpmn.xml或图片资源
     *
     * @param processDefinitionId 流程定义ID
     * @param resourceType        image:图片资源,xml:bpmn.xml
     * @return InputStream
     */
    InputStream loadProcessResource(String processDefinitionId,
                                    String resourceType);

    /**
     * 加载流程定义的bpmn.xml
     *
     * @param processDefinitionId 流程定义ID
     * @return String
     */
    String loadProcessXml(String processDefinitionId);

    /**
     * 更新流程部署模型
     *
     * @param deploymentId
     * @param processDefinitionId
     * @param resourceByte
     * @param isUpdateImage
     */
    void updateDeploymentResource(String deploymentId, String processDefinitionId, byte[] resourceByte, boolean isUpdateImage);

    /**
     * 刷新流程缓存
     *
     * @param processDefinitionId
     */
    void refreshProcessDefineCache(String processDefinitionId);

    /**
     * 删除流程定义
     *
     * @param procDefId
     * @param deploymentId
     * @param cascade
     * @return
     */
    boolean delete(String procDefId, String deploymentId, boolean cascade);

}