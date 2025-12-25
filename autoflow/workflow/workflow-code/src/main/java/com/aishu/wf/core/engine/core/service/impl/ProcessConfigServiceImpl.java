package com.aishu.wf.core.engine.core.service.impl;

import com.aishu.wf.core.common.util.ServiceResponse;
import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ActivityRule;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ActivityInfoConfigManager;
import com.aishu.wf.core.engine.config.service.ActivityRuleManager;
import com.aishu.wf.core.engine.config.service.ProcessInfoConfigManager;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.service.AbstractServiceHelper;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.dao.User2roleDao;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.thoughtworks.xstream.XStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @description 流程管理配置实现类
 * @author lw
 */
@Service
@Transactional(propagation = Propagation.SUPPORTS, readOnly = false)
@Slf4j
public class ProcessConfigServiceImpl extends AbstractServiceHelper implements ProcessConfigService {

	@Autowired
    private ProcessDefinitionService processDefinitionService;

    @Autowired
    private ProcessInfoConfigManager processInfoConfigManager;

    @Autowired
    private ActivityInfoConfigManager activityInfoConfigManager;

    @Autowired
    private ActivityRuleManager activityRuleManager;

    @Autowired
    private RoleService roleService;

    @Autowired
    private User2roleDao user2roleDao;

    /**
     * 获取流程绑定的界面路径
     * 获取界面路径的优先级为：1:环节,2:流程
     *
     * @param processDefId
     * @param activityDefId
     * @return
     * @throws WorkFlowException
     */
    @Override
    public String getWorkflowPage(String processDefId, String activityDefId) throws WorkFlowException {
        String pageUrl = "";
        ActivityInfoConfig apcParams = new ActivityInfoConfig();
        apcParams.setProcessDefId(processDefId);
        apcParams.setActivityDefId(activityDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(apcParams);
        ActivityInfoConfig activityPageConfig = activityInfoConfigManager.getOne(queryWrapper);
        //获取环节表单URL
        if (activityPageConfig != null) {
            if (StringUtils.isNotBlank(activityPageConfig.getActivityPageUrl())) {
                pageUrl = activityPageConfig.getActivityPageUrl();
            }
        }
        //获取流程表单URL
        if (StringUtils.isEmpty(pageUrl)) {
            ProcessInfoConfig processPageConfig = processInfoConfigManager.getById(processDefId);
            if (processPageConfig != null) {
                if (StringUtils.isNotBlank(processPageConfig.getProcessPageUrl())) {
                    pageUrl = processPageConfig.getProcessPageUrl();
                } else if (StringUtils.isNotBlank(processPageConfig.getProcessPageInfo())) {
                    pageUrl = processPageConfig.getProcessPageInfo();
                }
            }
        }
		/*if(StringUtils.isEmpty(pageUrl)){
			throw new WorkFlowException("没有在processPageConfig或activityPageConfig表中配置流程绑定的页面");
		}*/
        return pageUrl;
    }


    public Map<String, String> getPortalPage(String processDefId, String activityDefId) throws WorkFlowException {
        Map<String, String> url = new HashMap<String, String>();
        String cUrl = "";
        String cprotocol = "";
        String mUrl = "";
        String mprotocol = "";
        String mreadonly = "";
        ActivityInfoConfig apcParams = new ActivityInfoConfig();
        apcParams.setProcessDefId(processDefId);
        apcParams.setActivityDefId(activityDefId);
        QueryWrapper<ActivityInfoConfig> queryWrapper = new QueryWrapper<>(apcParams);
        ActivityInfoConfig activityPageConfig = activityInfoConfigManager.getOne(queryWrapper);
        //获取环节手机端表单URL
        if (activityPageConfig != null) {
            if (StringUtils.isNotBlank(activityPageConfig.getActivityPageUrl())) {
                cUrl = activityPageConfig.getActivityPageUrl();
            }
            if (StringUtils.isNotBlank(activityPageConfig.getCprotocol())) {
                cprotocol = activityPageConfig.getCprotocol();
            }
            if (StringUtils.isNotBlank(activityPageConfig.getMurl())) {
                mUrl = activityPageConfig.getMurl();
            }
            if (StringUtils.isNotBlank(activityPageConfig.getMprotocol())) {
                mprotocol = activityPageConfig.getMprotocol();
            }
            if (StringUtils.isNotBlank(activityPageConfig.getOtherSysDealStatus())) {
                mreadonly = activityPageConfig.getOtherSysDealStatus();
            }
        }
        //获取流程手机端表单URL
        ProcessInfoConfig processPageConfig = processInfoConfigManager.getById(processDefId);
        if (processPageConfig != null) {
            if (StringUtils.isEmpty(cUrl) && StringUtils.isNotBlank(processPageConfig.getProcessPageUrl())) {
                cUrl = processPageConfig.getProcessPageUrl();
            }
            if (StringUtils.isEmpty(cprotocol) && StringUtils.isNotBlank(processPageConfig.getCprotocol())) {
                cprotocol = processPageConfig.getCprotocol();
            }
            if (StringUtils.isEmpty(mUrl) && StringUtils.isNotBlank(processPageConfig.getMurl())) {
                mUrl = processPageConfig.getMurl();
            }
            if (StringUtils.isEmpty(mprotocol) && StringUtils.isNotBlank(processPageConfig.getMprotocol())) {
                mprotocol = processPageConfig.getMprotocol();
            }
            if (StringUtils.isEmpty(mreadonly) && StringUtils.isNotBlank(processPageConfig.getOtherSysDealStatus())) {
                mreadonly = processPageConfig.getOtherSysDealStatus();
            }
        }
		
		/*if(StringUtils.isEmpty(pageUrl)){
			throw new WorkFlowException("没有在processPageConfig或activityPageConfig表中配置流程绑定的页面");
		}*/
        url.put("curl", cUrl);
        url.put("cprotocol", cprotocol);
        url.put("murl", mUrl);
        url.put("mprotocol", mprotocol);
        url.put("mreadonly", mreadonly);
        return url;
    }


    @Override
    public List<ProcessInfoConfig> findProcessInfoConfigs(ProcessInfoConfig params)
            throws WorkFlowException {
        if (params == null) {
            params = new ProcessInfoConfig();
        }
        QueryWrapper<ProcessInfoConfig> query = new QueryWrapper<>(params);
        return processInfoConfigManager.list(query);
    }

    @Override
    public IPage<ProcessInfoConfig> findProcessInfoConfigsPage(ProcessDefinitionDTO queryDTO, ProcessInfoConfig params)
            throws WorkFlowException {
        params.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MGR_ISSHOW_Y);
        return processInfoConfigManager.findConfigPage(queryDTO, params);
    }

    @Override
    public Boolean checkEntity(ProcessInfoConfig params)
            throws WorkFlowException {
        params.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MGR_ISSHOW_Y);
        return processInfoConfigManager.findConfigCount(params) > 0;
    }

    /**
     * 获取所有满足要求的procDefId以供导出zip
     *
     * @param params
     * @return
     */
    @Override
    public List<String> getAllProcessIdForExport(ProcessInfoConfig params) {
        params.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MGR_ISSHOW_Y);
        return processInfoConfigManager.getAllProcessIdForExport(params);
    }

    @Override
    public ActivityInfoConfig getActivityInfoConfig(String processDefId,
                                                    String activityDefId, String opScope, Map<String, Object> pageDetailVaribale) throws WorkFlowException {
        ActivityInfoConfig activityInfoConfig = activityInfoConfigManager.getActivityInfoConfig(processDefId, activityDefId);
        if (activityInfoConfig == null) {
            activityInfoConfig = new ActivityInfoConfig();
        }
        return activityInfoConfig;
    }


    @Override
    public ActivityInfoConfig getActivityInfoConfigByLocal(String processDefId,
                                                           String activityDefId) throws WorkFlowException {
        ActivityInfoConfig activityInfoConfig = activityInfoConfigManager
                .getActivityInfoConfig(processDefId, activityDefId);
        if (activityInfoConfig == null) {
            activityInfoConfig = new ActivityInfoConfig();
        }
        return activityInfoConfig;
    }

    @Override
    public ActivityInfoConfig getActivityInfoConfig(String processDefId,
                                                    String activityDefId) throws WorkFlowException {
        ActivityInfoConfig activityInfoConfig = activityInfoConfigManager
                .getActivityInfoConfig(processDefId, activityDefId);
        if (activityInfoConfig == null) {
            activityInfoConfig = new ActivityInfoConfig();
        }
        return activityInfoConfig;
    }

    @Override
    public ProcessInfoConfig getProcessInfoConfig(String processDefId)
            throws WorkFlowException {
        ProcessInfoConfig processInfoConfig = processInfoConfigManager.getById(processDefId);
        return processInfoConfig;
    }

    @Override
    public List<ProcessInfoConfig> getBatchProcessInfoConfig(List<String> processDefIdList)
            throws WorkFlowException {
        List<ProcessInfoConfig> processInfoConfigList = processInfoConfigManager.listByIds(processDefIdList);
        return processInfoConfigList;
    }

    @Override
    public List<ProcessInfoConfig> getBatchProcessInfoByKey(List<String> processDefKeyList) throws WorkFlowException {
        List<ProcessInfoConfig> processInfoConfigList = processInfoConfigManager.list(new LambdaQueryWrapper<ProcessInfoConfig>()
                .in(ProcessInfoConfig::getProcessDefKey, processDefKeyList));
        return processInfoConfigList;
    }

    @Override
    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public boolean deleteProcessInfoConfig(String processDefId) throws WorkFlowException {
        processInfoConfigManager.removeById(processDefId);
        activityInfoConfigManager.deleteActivityInfoConfigs(processDefId);
        activityRuleManager.deleteAllActivityRule(processDefId);
        return true;
    }

    @Override
    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public boolean deleteBatchProcessInfoConfig(List<String> processDefIdList) throws WorkFlowException {
        /*processInfoConfigManager.removeByIds(processDefIdList);
        activityInfoConfigManager.remove(new LambdaQueryWrapper<ActivityInfoConfig>().in(ActivityInfoConfig::getProcessDefId, processDefIdList));
        activityRuleManager.remove(new LambdaQueryWrapper<ActivityRule>().in(ActivityRule::getProcDefId, processDefIdList));*/

        // 逻辑删除（后续提供爱数失效流程）
        ProcessInfoConfig updateConfig = new ProcessInfoConfig();
        updateConfig.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MGR_ISSHOW_N);
        processInfoConfigManager.update(updateConfig, new LambdaQueryWrapper<ProcessInfoConfig>().in(ProcessInfoConfig::getProcessDefId, processDefIdList));
        return true;
    }

    @Override
    public ByteArrayOutputStream exportOneProcessData(String processDefId) {
        ProcessInfoConfig processInfoConfig = this
                .getProcessInfoConfig(processDefId);
        List<ActivityInfoConfig> activityInfoConfigs = activityInfoConfigManager
                .findActivityInfoConfigs(processInfoConfig.getProcessDefId());
        processInfoConfig.setActivityInfoConfigs(activityInfoConfigs);
        List<ActivityRule> activityRules = activityRuleManager.findActivityRules(processInfoConfig.getProcessDefId(), "");
        processInfoConfig.setActivityRules(activityRules);
        XStream xstream = new XStream();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        xstream.toXML(processInfoConfig, out);
        return out;

    }


    @SuppressWarnings("unchecked")
    @Override
    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public ServiceResponse<Void> importOneProcessData(String proceDefId, String tenantId, String deploymentId, String fileContent,
                                                      String importType) {
        ServiceResponse<Void> serviceResponse = new ServiceResponse<Void>(
                new Date());
        try {
            XStream xstream = new XStream();
            ProcessInfoConfig importProcessInfoConfig = (ProcessInfoConfig) xstream
                    .fromXML(fileContent);
            if (StringUtils.isNotBlank(proceDefId)) {
                importProcessInfoConfig.setProcessDefId(proceDefId);
            }
            if (StringUtils.isNotBlank(deploymentId)) {
                importProcessInfoConfig.setDeploymentId(deploymentId);
            }
            if (importProcessInfoConfig == null) {
                return serviceResponse.build(
                        ServiceResponse.STATUS_PARAMS_ERROR,
                        "无法将导入流程配置转换为ProcessInfoConfig对象");
            }
            ProcessDefinitionModel processDefinitionModel = null;
            try {
                processDefinitionModel = processDefinitionService.getProcessDef(importProcessInfoConfig.getProcessDefId());
            } catch (Exception e) {
               log.warn("",e);
            }
            if (processDefinitionModel == null || StringUtils.isEmpty(processDefinitionModel.getProcDefId())) {
                processDefinitionModel = processDefinitionService.getProcessDefBykey(importProcessInfoConfig.getProcessDefKey());
                if (processDefinitionModel == null || StringUtils.isEmpty(processDefinitionModel.getProcDefId())) {
                    return serviceResponse.build(
                            ServiceResponse.STATUS_PARAMS_ERROR,
                            "无法找到流程定义对象,可能流程定义已被删除。导入的流程配置对象信息:"
                                    + importProcessInfoConfig);
                }
                importProcessInfoConfig.setProcessDefId(processDefinitionModel.getProcDefId());
            }
            importProcessInfoConfig.setTenantId(tenantId);
            if ("0".equals(importType)) {// 覆盖
                processInfoConfigManager.removeById(importProcessInfoConfig
                        .getProcessDefId());
                processInfoConfigManager.save(importProcessInfoConfig);

                if (importProcessInfoConfig.getActivityInfoConfigs() != null) {
                    activityInfoConfigManager
                            .deleteActivityInfoConfigs(importProcessInfoConfig
                                    .getProcessDefId());
                    for (ActivityInfoConfig importActivityInfoConfig : importProcessInfoConfig
                            .getActivityInfoConfigs()) {
                        if (importActivityInfoConfig == null) {
                            continue;
                        }
                        importActivityInfoConfig.setProcessDefId(importProcessInfoConfig.getProcessDefId());
                        activityInfoConfigManager
                                .save(importActivityInfoConfig);
                    }
                }
                if (importProcessInfoConfig.getActivityRules() != null) {
                    activityRuleManager
                            .deleteAllActivityRule(importProcessInfoConfig
                                    .getProcessDefId());
                    for (ActivityRule activityRule : importProcessInfoConfig
                            .getActivityRules()) {
                        if (activityRule == null) {
                            continue;
                        }
                        activityRule.setProcDefId(importProcessInfoConfig.getProcessDefId());
                        activityRuleManager.save(activityRule);
                    }
                }
            } else if ("1".equals(importType)) {// 跳过

            }
        } catch (Exception e) {
            log.warn("", e);
        }
        serviceResponse = serviceResponse.build(
                ServiceResponse.STATUS_OP_SUCCESS,
                "导入流程配置成功！");
        return serviceResponse;
    }

    @Override
    public boolean isThroughBizAppProcess(String processDefId, String activityDefId) {
        boolean isThroughFlag = false;
        ActivityInfoConfig activityInfoConfig = getActivityInfoConfig(processDefId, activityDefId);
        if (activityInfoConfig == null) {
            return isThroughFlag;
        }
        if (ActivityInfoConfig.ACTIVITY_DEF_CHILD_TYPE_THROUGH.equals(activityInfoConfig.getActivityDefChildType())) {
            isThroughFlag = true;
        }
        return isThroughFlag;

    }

    @Override
    public ByteArrayOutputStream exportAllRoleData(String appId) {
        QueryWrapper<Role> wrapper = new QueryWrapper<>();
        wrapper.lambda().eq(Role::getRoleAppId,appId).eq(Role::getRoleType,"BIZ");
        List<Role> roles = roleService.list(wrapper);
        for (Role role : roles) {
            List<User2role> user2roles = user2roleDao.getUser2roleList(role.getRoleId());
            role.setUser2roles(user2roles);
        }
        XStream xstream = new XStream();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        xstream.toXML(roles, out);
        return out;
    }


    @Override
    public void importAllRoleData(String fileContent) {
        XStream xstream = new XStream();
        @SuppressWarnings("unchecked")
        List<Role> newRoles = (List<Role>) xstream
                .fromXML(fileContent);
        for (Role newRole : newRoles) {
            Role oldRole = roleService.getById(newRole.getRoleId());
            if (oldRole != null && StringUtils.isNotBlank(oldRole.getRoleId())) {
                roleService.updateById(newRole);
            } else {
                roleService.save(newRole);
            }
            List<User2role> user2roles = newRole.getUser2roles();
            for (User2role newUser2role : user2roles) {
                QueryWrapper<User2role> wrapper = new QueryWrapper<>();
                wrapper.lambda().eq(User2role::getRoleId,newUser2role.getRoleId()).eq(User2role::getUserId,newUser2role.getUserId());
                User2role oldUser2role = user2roleDao.selectOne(wrapper);
                if (oldUser2role == null) {
                    user2roleDao.insert(newUser2role);
                } else {
                    user2roleDao.update(newUser2role,wrapper);
                }
            }
        }
    }

    @Override
    public IPage<List<ProcessInfoConfig>> findProcessConfigAndModel(ProcessDefinitionDTO queryDTO, ProcessInfoConfig params)
            throws WorkFlowException {
        params.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MGR_ISSHOW_Y);
        return processInfoConfigManager.findConfigAndModelPage(queryDTO, params);
    }


	@Override
	public List<String> getPreTaskAssignee(String processInstanceId, String taskId) {
		return processInfoConfigManager.getPreTaskInstance(processInstanceId, taskId);
	}

}
