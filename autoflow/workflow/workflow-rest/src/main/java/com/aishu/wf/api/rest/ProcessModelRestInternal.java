package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.*;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.service.DeptAuditorRuleService;
import com.aishu.wf.core.engine.config.model.ProcDefModel;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessConfigService;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.impl.ProcessModelServiceImpl;
import com.aishu.wf.core.engine.identity.model.Role;
import io.swagger.annotations.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * @description 流程定义类服务
 * @author hanj
 */
@RestController
@RequestMapping(value = "/process-model-internal")
@Api(tags = "流程模型")
@Slf4j
public class ProcessModelRestInternal extends BaseRest {

	@Autowired
	private ProcessConfigService processConfigService;
	@Autowired
	private BeansBuilder beansBuilder;
	@Autowired
	private ProcessDefinitionService processDefinitionService;
	@Autowired
	private ProcessModelServiceImpl processModelService;

	@Autowired
	private DeptAuditorRuleService deptAuditorRuleService;

	@ApiOperation(value = "获取流程模型信息")
	@ApiImplicitParam(name = "id", value = "流程定义ID")
	@GetMapping(value = "/{id}")
	public ProcessModelVO getProcessDefModel(@PathVariable String id) {
		ProcDefModel processDefModel = processModelService.getProcessDefModelByProcDefId(id);
		if (!CommonConstants.TENANT_AS_WORKFLOW.equals(processDefModel.getTenantId())) {
			processDefModel.getDocShareStrategyList().forEach(strategy -> {
				Role role = deptAuditorRuleService.getDeptAuditorRule(strategy.getRuleId());
				strategy.setDept_auditor_rule_list(DeptAuditorRuleRoleVO.builderDeptAuditorRuleList(role));
			});
		}

		return ProcessModelVO.builder(processDefModel);
	}

	@ApiOperation(value = "部署流程模型")
	@ApiImplicitParams({ @ApiImplicitParam(name = "processDeploymentDTO", value = "流程建模部署对象"),
			@ApiImplicitParam(name = "type", value = "类型；new：生成新版本") })
	@ApiResponse(code = 200, message = "操作成功", response = ProcessDeploymentVO.class)
	@PostMapping(value = "", produces = "application/json; charset=UTF-8")
	public ProcessDeploymentVO deployment(@Valid @RequestBody ProcessDeploymentDTO processDeploymentDTO,
			@RequestParam @ArrayValuable(values = { "new" }, message = "文档类型不正确") String type) {
		return ProcessDeploymentVO.builder()
				.id(processDefinitionService.deployProcess(processDeploymentDTO, type, "")).build();
	}

}
