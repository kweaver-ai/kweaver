package com.aishu.wf.core.engine.config.service;

import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.engine.config.dao.ProcessInfoConfigDao;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.identity.UserService;
import com.aishu.wf.core.engine.util.WorkFlowException;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * @author lw
 * @version 1.0
 * @since  
 */

@Service
public class ProcessInfoConfigManager extends ServiceImpl<ProcessInfoConfigDao, ProcessInfoConfig> {

	@Autowired
	private UserService userService;

	@Autowired
	private ProcessInfoConfigDao processInfoConfigDao;

	@Autowired
	ProcessDefinitionService processDefinitionService;

	/**
	 * @description 获取流程配置分页信息
	 * @author hanj
	 * @version 1.0
	 */
	public IPage<ProcessInfoConfig> findConfigPage(ProcessDefinitionDTO queryDTO, ProcessInfoConfig query) {
		return processInfoConfigDao.selectPage(new Page<>(queryDTO.getPageNumber(),
				queryDTO.getPageSize()), assembleWrapper(query, queryDTO));
	}

	/**
	 * @description 获取流程配置条目
	 * @author hanj
	 * @version 1.0
	 */
	public long findConfigCount(ProcessInfoConfig query){
		QueryWrapper<ProcessInfoConfig> queryWrapper = new QueryWrapper<>(query);
		List<ProcessInfoConfig> list = list(queryWrapper);
		return list.size();
	}

	/**
	 * @description 获取流程定义ID（供导出zip）
	 * @author hanj
	 * @version 1.0
	 */
	public List<String> getAllProcessIdForExport(ProcessInfoConfig query) {
		List<String> resultList = new ArrayList<>();
		List<ProcessInfoConfig> list = list(assembleWrapper(query, null));
		list.forEach(e -> {
			resultList.add(e.getProcessDefId());
		});
		return resultList;
	}

	/**
	 * @description 查询流程定义ID的配置信息
	 * @author hanj
	 * @version 1.0
	 */
	public ProcessInfoConfig getLinkId(String processDefId){
		if(StringUtils.isEmpty(processDefId)){
			throw new WorkFlowException(ExceptionErrorCode.B2001,"processDefId is nulll");
		}
		QueryWrapper<ProcessInfoConfig> queryWrapper = new QueryWrapper<>();
		queryWrapper.lambda().likeLeft(ProcessInfoConfig::getProcessDefId, processDefId);
		ProcessInfoConfig processInfoConfig = processInfoConfigDao.selectOne(queryWrapper);
		if(processInfoConfig!=null){
			ProcessDefinitionModel processDefinition=processDefinitionService.getProcessDef(processInfoConfig.getProcessDefId());
			processInfoConfig.setProcessDefName(processDefinition.getProcDefName());
			processInfoConfig.setProcessVersion(processDefinition.getVersion());
			processInfoConfig.setProcessDefKey(processDefinition.getProcDefKey());
		}
		return processInfoConfig;
	}

	/**
	 * @description 版本变更恢复还原流程基本配置信息
	 * @author hanj
	 * @version 1.0
	 */
	public void recoverProcessInfoConfig(String procDefId){
		ProcessInfoConfig prevProcessInfoConfig = getPrevVersionProcessConfig(procDefId);
		if(prevProcessInfoConfig!=null){
			prevProcessInfoConfig.setProcessMgrIsshow(ProcessInfoConfig.PROCESS_MODEL_SYNC_STATE_Y);
			updateById(prevProcessInfoConfig);
		}
	}

	/**
	 * @description 获取上级版本的基本配置信息
	 * @author hanj
	 * @version 1.0
	 */
	public ProcessInfoConfig getPrevVersionProcessConfig(String procDefId) {
		ProcessInfoConfig processInfoConfig = null;
		String[] processDefinitionIdArray = procDefId.split(":");
		if (Integer.parseInt(processDefinitionIdArray[1]) > 1) {
			processInfoConfig = getLinkId(processDefinitionIdArray[0] + ":" + (Integer.parseInt(processDefinitionIdArray[1]) - 1));
		}
		return processInfoConfig;
	}

	/**
	 * @description 获取流程定义配置和模型分页数据
	 * @author hanj
	 * @version 1.0
	 */
	public IPage<List<ProcessInfoConfig>> findConfigAndModelPage(ProcessDefinitionDTO queryDTO, ProcessInfoConfig query){
		return processInfoConfigDao.findConfigAndModelPage(new Page<>(queryDTO.getPageNumber(),
				queryDTO.getPageSize()), assembleWrapper(query, null));
	}

	/**
	 * @description 组装条件
	 * @author hanj
	 * @version 1.0
	 */
	private QueryWrapper<ProcessInfoConfig> assembleWrapper(ProcessInfoConfig query, ProcessDefinitionDTO queryDTO){
		QueryWrapper<ProcessInfoConfig> queryWrapper = new QueryWrapper<>();
		if(query.getFilterShare() == 1){
			queryWrapper.lambda().ne(ProcessInfoConfig::getProcessTypeId, WorkflowConstants.WORKFLOW_TYPE_SHARE);
		}
		if(StrUtil.isNotBlank(query.getProcessTypeId())){
			queryWrapper.lambda().eq(ProcessInfoConfig::getProcessTypeId, query.getProcessTypeId());
		}
		if(StrUtil.isNotBlank(query.getProcessDefId())){
			queryWrapper.lambda().like(ProcessInfoConfig::getProcessDefId, query.getProcessDefId());
		}
		if(StrUtil.isNotBlank(query.getProcessDefKey())){
			queryWrapper.lambda().like(ProcessInfoConfig::getProcessDefKey, query.getProcessDefKey());
		}
		if(StrUtil.isNotBlank(query.getProcessDefName())){
			queryWrapper.lambda().like(ProcessInfoConfig::getProcessDefName, query.getProcessDefName());
		}
		if(StrUtil.isNotBlank(query.getCreateUser())){
			queryWrapper.lambda().eq(ProcessInfoConfig::getCreateUser, query.getCreateUser());
		}
		if(StrUtil.isNotBlank(query.getCreateUserName())){
			queryWrapper.lambda().like(ProcessInfoConfig::getCreateUserName, query.getCreateUserName());
		}
		if(StrUtil.isNotBlank(query.getTemplate())){
			queryWrapper.lambda().eq(ProcessInfoConfig::getTemplate, query.getTemplate());
		}else{
			queryWrapper.lambda().apply("(template <> 'Y' or template is null)");
		}
		if(StrUtil.isNotBlank(queryDTO.getAuditor_word())){
			// 支持流程名称，部门审核员规则中的审核员名称，审核策略审核员名称，部门审核员规则名称四种场景的关键字匹配
			queryWrapper.lambda().apply("(process_def_id in (SELECT t1.proc_def_id FROM t_wf_doc_share_strategy t1 LEFT JOIN t_wf_role t2 ON t1.rule_id = t2.role_id WHERE t2.role_name like concat('%', {0}, '%') GROUP BY t1.proc_def_id) or " +
					"process_def_id in (SELECT t1.proc_def_id FROM t_wf_doc_share_strategy t1 LEFT JOIN t_wf_user2role t2 ON t1.rule_id = t2.role_id WHERE t2.user_name LIKE concat('%', {0}, '%') GROUP BY t1.proc_def_id) or " +
					"process_def_id in (SELECT t1.proc_def_id FROM t_wf_doc_share_strategy t1 LEFT JOIN t_wf_doc_share_strategy_auditor t2 ON t1.id = t2.audit_strategy_id WHERE t2.user_name like concat('%', {0}, '%') GROUP BY t1.proc_def_id) or " +
					"process_def_name like concat('%', {0}, '%'))", queryDTO.getAuditor_word());
		}
		if(StrUtil.isNotBlank(query.getAuditor())){
			queryWrapper.lambda().apply("(process_def_id in (SELECT t1.proc_def_id FROM t_wf_doc_share_strategy t1 LEFT JOIN t_wf_doc_share_strategy_auditor t2 ON t1.id = t2.audit_strategy_id WHERE t2.user_name like concat('%', {0}, '%') GROUP BY t1.proc_def_id))", query.getAuditor());
		}
		queryWrapper.lambda().eq(ProcessInfoConfig::getTenantId, query.getTenantId());
		queryWrapper.lambda().eq(ProcessInfoConfig::getProcessMgrIsshow, query.getProcessMgrIsshow());
		queryWrapper.lambda().orderByDesc(ProcessInfoConfig::getCreateTime);


		assembleWrapperInQuery(queryWrapper, queryDTO);
		return queryWrapper;
	}

	/**
	 * @description 组装In条件
	 * @author ouandyang
	 * @updateTime 2021/12/9
	 */
	private void assembleWrapperInQuery(QueryWrapper<ProcessInfoConfig> queryWrapper, ProcessDefinitionDTO queryDTO){
		if (queryDTO != null && ArrayUtil.isNotEmpty(queryDTO.getNames())) {
			String sql = "(";
			for (int i = 0; i < queryDTO.getNames().length; i++) {
				if (i > 0) {
					sql = sql + " or";
				}
				sql = sql + " process_def_name like '%" + queryDTO.getNames()[i] + "%'";
			}
			sql = sql + ")";
			queryWrapper.lambda().apply(sql);
		}

		if (queryDTO != null && ArrayUtil.isNotEmpty(queryDTO.getCreate_users())) {
			String sql = "(";
			for (int i = 0; i < queryDTO.getCreate_users().length; i++) {
				if (i > 0) {
					sql = sql + " or";
				}
				sql = sql + " create_user_name like '%" + queryDTO.getCreate_users()[i] + "%'";
			}
			sql = sql + ")";
			queryWrapper.lambda().apply(sql);
		}

		if (queryDTO != null && ArrayUtil.isNotEmpty(queryDTO.getAuditors())) {
			String sql = "(";
			for (int i = 0; i < queryDTO.getAuditors().length; i++) {
				if (i > 0) {
					sql = sql + " or";
				}
				sql = sql + " process_def_id in (SELECT t1.proc_def_id FROM t_wf_doc_share_strategy t1 LEFT JOIN t_wf_doc_share_strategy_auditor t2 ON t1.id = t2.audit_strategy_id WHERE t2.user_name like '%" + queryDTO.getAuditors()[i] + "%' GROUP BY t1.proc_def_id)";
			}
			sql = sql + ")";
			queryWrapper.lambda().apply(sql);
		}

		if (queryDTO != null && ArrayUtil.isNotEmpty(queryDTO.getRules())) {
			String sql = "(";
			for (int i = 0; i < queryDTO.getRules().length; i++) {
				if (i > 0) {
					sql = sql + " or";
				}
				sql = sql + " process_def_id in (SELECT t1.proc_def_id FROM t_wf_doc_share_strategy t1 LEFT JOIN t_wf_role t2 ON t1.rule_id = t2.role_id WHERE t2.role_name like '%" + queryDTO.getRules()[i] + "%' GROUP BY t1.proc_def_id)";
			}
			sql = sql + ")";
			queryWrapper.lambda().apply(sql);
		}
	}
	
	/**
	 * @description 获取经办任务接收人
	 * @author hanj
	 * @version 1.0
	 */
	public List<String> getPreTaskInstance(String processInstanceId,String taskId) {
		return processInfoConfigDao.getPreTaskInstance(processInstanceId,taskId);
	}
	
}
