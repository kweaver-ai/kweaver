package com.aishu.wf.api.model;

import com.aishu.wf.core.engine.config.model.ActivityInfoConfig;
import com.aishu.wf.core.engine.config.model.ApplicationEntity;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.config.service.ApplicationManager;
import com.aishu.wf.core.engine.core.model.ActivityDefinitionModel;
import com.aishu.wf.core.engine.core.model.ActivityInstanceModel;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import org.activiti.engine.impl.persistence.entity.HistoricProcessInstanceEntity;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * @description 转换引擎内部的数据结构为对外提供的格式，严格跟接口文档一致
 * @author hanj
 */
@Service
public class BeansBuilder {	
	@Autowired
	private ApplicationManager applicationManager;
	
	private static Map<String, ApplicationEntity> applications = new HashMap<String, ApplicationEntity>();

	/**
	 * @description 流程定义实体转VO
	 * @author hanj
	 * @param  model
	 * @updateTime 2021/5/13
	 */
	public ProcessDefinitionVO build(ProcessDefinitionModel model) {
		ProcessDefinitionVO bean = new ProcessDefinitionVO();
		BeanUtils.copyProperties(model, bean);
		ProcessInfoConfig config = model.getProcessInfoConfig();
		if(null != config){
			bean.setDescription(config.getRemark());
			bean.setTypeId(config.getProcessTypeId());
			bean.setTypeName(config.getProcessTypeName());
			bean.setOrder(config.getProcessStartOrder());
		}
		return bean;
	}

	/**
	 * @description 环节定义实体转VO
	 * @author hanj
	 * @param  model
	 * @updateTime 2021/5/13
	 */
	public ActivityDefinitionVO build(ActivityDefinitionModel model) {
		ActivityDefinitionVO bean = new ActivityDefinitionVO();
		BeanUtils.copyProperties(model, bean);
		bean.setActDefType(model.getActType());
		ActivityInfoConfig config = model.getActivityInfoConfig();
		bean.setActDefDealType(config.getActivityDefDealType());
		bean.setActDefChildType(config.getActivityDefChildType());
		bean.setPageUrl(config.getActivityPageInfo());
		//bean.setMportalProtocol(config.getMprotocol());
		bean.setMportalUrl(config.getMurl());
		bean.setOtherSysDealStatus(config.getOtherSysDealStatus());
		//bean.setCportalProtocol(config.getCprotocol());
		bean.setJumpType(config.getJumpType());
		bean.setIdeaDisplayArea(config.getIdeaDisplayArea());
		bean.setShowIdea(config.getIsShowIdea());
		bean.setActLimitTime(config.getActivityLimitTime());
		bean.setDescription(StringUtils.isEmpty(config.getRemark())?model.getDescription():config.getRemark());
		bean.setActDefOrder(config.getActivityOrder());
		return bean;
	}

	/**
	 * @description 环节定义实体集合转VO
	 * @author hanj
	 * @param  list
	 * @updateTime 2021/5/13
	 */
	public List<ActivityDefinitionVO> buildActDefList(List<ActivityDefinitionModel> list){
		List<ActivityDefinitionVO> result = new ArrayList<ActivityDefinitionVO>();
		for (int i=0; i<list.size(); i++) {
			ActivityDefinitionVO bean = build(list.get(i));
			result.add(bean);
		}
		return result;
	}

	/**
	 * @description 流程定义实体集合转VO
	 * @author hanj
	 * @param  list
	 * @updateTime 2021/5/13
	 */
	public List<ProcessDefinitionVO> buildProcDefList(List<ProcessDefinitionModel> list){
		List<ProcessDefinitionVO> result = new ArrayList<ProcessDefinitionVO>();
		for (int i=0; i<list.size(); i++) {
			ProcessDefinitionVO bean = build(list.get(i));
			result.add(bean);
		}
		return result;
	}

	/**
	 * @description 流程实例实体转VO
	 * @author hanj
	 * @param  list
	 * @updateTime 2021/5/13
	 */
	public List<ProcessInstanceVO> buildProcInstList(List<ProcessInstanceModel> list){
		List<ProcessInstanceVO> result = new ArrayList<ProcessInstanceVO>();
		for(int i=0;i<list.size();i++) {
			ProcessInstanceVO bean = build(list.get(i));
			result.add(bean);
		}
		return result;
	}

	/**
	 * @description 流程定义实体转VO
	 * @author hanj
	 * @param  maps
	 * @updateTime 2021/5/13
	 */
	public List<ProcessDefinitionVO> build(Map<String,List<ProcessDefinitionModel>> maps){
		List<ProcessDefinitionVO> result = new ArrayList<ProcessDefinitionVO>();
		for(Map.Entry<String, List<ProcessDefinitionModel>> entry : maps.entrySet()) {
			List<ProcessDefinitionVO> dest = buildProcDefList(entry.getValue());
			result.addAll(dest);
		}
		Collections.sort(result, new Comparator<ProcessDefinitionVO>(){
            public int compare(ProcessDefinitionVO arg0, ProcessDefinitionVO arg1) {
            	if(arg0.getOrder() == null)
            		return 1;
            	if(arg1.getOrder() == null)
            		return -1;
                return arg0.getOrder().compareTo(arg1.getOrder());
            }
        });
		return result;
	}

	/**
	 * @description 环节实例实体转VO
	 * @author hanj
	 * @param  model
	 * @updateTime 2021/5/13
	 */
	public ActivityInstanceVO build(ActivityInstanceModel model) {
		ActivityInstanceVO bean = new ActivityInstanceVO();
		BeanUtils.copyProperties(model, bean);
		bean.setActInstState(model.getActState());
		bean.setSendUserOrgId(model.getSenderOrgId());
		bean.setSendUserOrgName(model.getSenderOrgName());
		bean.setReceiverUserOrgId(model.getReceiverOrgId());
		bean.setReceiverUserOrgName(model.getReceiverOrgName());
//		String URL = this.getApplicationUrl(model.getTenantId());
//		if(URL.indexOf('?') != -1)
//			URL += "&procDefId=" + bean.getProcDefId();
//		else
//			URL += "?procDefId=" + bean.getProcDefId();
//		URL += "&procInstId=" + bean.getProcInstId() + "&actDefId=" + bean.getActDefId() + "&actInstId=" + bean.getActInstId();
		return bean;
	}
	
	/**
	 * @description 环节实例实体集合转VO
	 * @author hanj
	 * @param  list
	 * @updateTime 2021/5/13
	 */
	public List<ActivityInstanceVO> buildActInstList(List<ActivityInstanceModel> list){
		List<ActivityInstanceVO> result = new ArrayList<ActivityInstanceVO>();
		for(ActivityInstanceModel model : list) {
			result.add(this.build(model));
		}
		return result;
	}

	/**
	 * @description 流程实例实体转VO
	 * @author hanj
	 * @param  model
	 * @updateTime 2021/5/13
	 */
	public ProcessInstanceVO build(ProcessInstanceModel model) {
		ProcessInstanceVO bean = new ProcessInstanceVO();
		BeanUtils.copyProperties(model, bean);
		bean.setProcInstTitle(model.getProcTitle());
//		if(model.getCurrentActivity() != null) {//结束流程为空
//			bean.setCurActDefId(model.getCurrentActivity().getActDefId());
//			bean.setCurActDefName(model.getCurrentActivity().getActDefName());
//		}
		bean.setStartUserOrgId(model.getStarterOrgId());
		bean.setStartUserOrgName(model.getStarterOrgName());
		bean.setProcInstState(model.getProcState());
		List<ActivityInstanceVO> actInstBeans=new ArrayList<ActivityInstanceVO>();
		if(model.getNextActivity()!=null&&!model.getNextActivity().isEmpty()){
			List<ActivityInstanceModel> actInsts=model.getNextActivity();
			for (ActivityInstanceModel actInst : actInsts) {
				actInstBeans.add(this.build(actInst));
			}
			bean.setNextActInsts(actInstBeans);
		}
		return bean;
	}

	/**
	 * @description 历史流程实例实体转VO
	 * @author hanj
	 * @param  entity
	 * @updateTime 2021/5/13
	 */
	public ProcessInstanceVO build(HistoricProcessInstanceEntity entity) {
		ProcessInstanceVO bean = new ProcessInstanceVO();
		bean.setProcDefId(entity.getProcessDefinitionId());
		bean.setProcDefName(entity.getProcessDefinitionName());
		bean.setProcInstTitle(entity.getProcTitle());
		bean.setBusinessKey(entity.getBusinessKey());
		bean.setCreateTime(entity.getStartTime());
		bean.setStartUserId(entity.getStartUserId());
		bean.setProcInstId(entity.getId());
		bean.setProcInstState(String.valueOf(entity.getProcState()));
		bean.setTenantId(entity.getTenantId());
		bean.setFinishTime(entity.getEndTime());
		bean.setTopProcInstId(entity.getTopProcessInstanceId());
		bean.setParentProcInstId(entity.getSuperProcessInstanceId());
		return bean;
	}

	/**
	 * @description 流程配置信息实体转VO
	 * @author hanj
	 * @param  config
	 * @updateTime 2021/5/13
	 */
	public ProcessDefinitionVO build(ProcessInfoConfig config) {
		ProcessDefinitionVO bean = new ProcessDefinitionVO();
		bean.setProcDefKey(config.getProcessDefKey());
		bean.setProcDefName(config.getProcessDefName());
		bean.setDescription(config.getRemark());
		bean.setTypeId(config.getProcessTypeId());
		bean.setTypeName(config.getProcessTypeName());
		bean.setOrder(config.getProcessStartOrder());
		bean.setCreateTime(config.getCreateTime());
		bean.setCreateUser(config.getCreateUser());
		return bean;
	}

	/**
	 * @description 流程配置信息实体集合转VO
	 * @author hanj
	 * @param  list
	 * @updateTime 2021/5/13
	 */
	public List<ProcessDefinitionVO> buildProcessDefinitions(List<ProcessInfoConfig> list){
		List<ProcessDefinitionVO> result = new ArrayList<ProcessDefinitionVO>();
		for (int i=0; i<list.size(); i++) {
			ProcessDefinitionVO bean = build(list.get(i));
			result.add(bean);
		}
		return result;
	}
}
