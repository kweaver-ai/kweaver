package com.aishu.wf.api.rest;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.api.model.BeansBuilder;
import com.aishu.wf.api.model.ProcessInfoConfigVO;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.model.dto.ProcessDefinitionDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessCategoryDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.core.service.impl.ProcessModelServiceImpl;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.annotations.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 流程定义类服务
 * @author hanj
 */
@RestController
@RequestMapping(value = "/process-definition")
@Api(tags = "流程定义")
public class ProcessDefinitionRest  extends BaseRest {

	@Autowired
	private ProcessDefinitionService processDefinitionService;
	@Autowired
	private ProcessModelServiceImpl processModelService;
	@Autowired
	private DocShareStrategyService docShareStrategyService;
	@Autowired
	private AuditConfig auditConfig;

	@ApiOperation(value = "获取流程定义列表")
	@PageQuery
	@GetMapping(value = "")
	public PageWrapper<ProcessInfoConfigVO> list(
			@ApiParam(name = "queryDTO", value = "流程定义查询对象") @Valid ProcessDefinitionDTO queryDTO) {
		IPage<ProcessInfoConfig> page = processDefinitionService.findProcessDefinitionList(queryDTO, this.getUserId());
		List<ProcessInfoConfigVO> processInfoConfigVOList = page.getRecords().stream().map(ProcessInfoConfigVO::builder)
				.collect(Collectors.toList());
		return new PageWrapper<ProcessInfoConfigVO>(processInfoConfigVOList, (int) page.getTotal());
	}

	@ApiOperation(value = "获取流程定义信息")
	@ResponseBody
	@GetMapping(value = "/{key}", produces = "application/json; charset=UTF-8")
	public ProcessInfoConfigVO getProcessDefinitionByKey(@PathVariable String key) {
		ProcessInfoConfig model = processDefinitionService.findProcessDefinitionByKey(key);
		ProcessInfoConfigVO processInfoConfigVO = ProcessInfoConfigVO.builder(model);
		// 查询流程是否有效
		int effectivity = ProcessInfoConfig.PROCESS_MGR_ISSHOW_Y.equals(model.getProcessMgrIsshow()) ? 0 : 1;
		processInfoConfigVO.setEffectivity(effectivity);
		return processInfoConfigVO;
	}

	@ApiOperation(value = "批量删除流程定义信息")
	@DeleteMapping(value = "",produces = "application/json; charset=UTF-8")
	public void deleteBatchProcessDef(@ApiParam(value="流程定义id集合",required = true)@RequestBody List<String> ids) {
		processDefinitionService.deleteBatchProcessDef(ids);
	}

	@ApiOperation(value = "删除流程定义信息")
	@DeleteMapping(value = "/{id}",produces = "application/json; charset=UTF-8")
	public void deleteProcessDef(@ApiParam(value="流程定义id",required = true)@PathVariable String id) {
		processDefinitionService.deleteBatchProcessDef(Arrays.asList(id));
	}

	@ApiOperation(value = "启用流程定义")
	@ApiImplicitParams({ @ApiImplicitParam(name = "id", value = "流程定义ID"), })
	@PostMapping(value = "/enable/{id}",produces = "application/json; charset=UTF-8")
	public void enableProcessDef(@PathVariable String id) {
		processDefinitionService.enableProcessDef(id);
	}

	@ApiOperation(value = "获取流程分类集合", hidden = true)
	@GetMapping(value = "/category/list",produces = "application/json; charset=UTF-8")
	public List<JSONObject> categoryList(@ApiParam(name = "queryDTO", value = "流程分类查询对象") @Valid ProcessCategoryDTO queryDTO) {
		List<JSONObject> result = new ArrayList<>();
		List<Object> categoryList = auditConfig.getFrontPlugin(queryDTO);
		categoryList.forEach(e -> {
			JSONObject item = JSONUtil.parseObj(e);
			item.set("category", WorkflowConstants.PROCESS_CATEGORY.getCategory(item.getStr("audit_type")));
			result.add(item);
		});
		return result;
	}

	@ApiOperation(value = "获取自定义审核策略项", hidden = true)
	@GetMapping(value = "/strategy/tags",produces = "application/json; charset=UTF-8")
	public List<JSONObject> strategyTagList() {
		List<JSONObject> tagList = auditConfig.getAuditorPlugin();
		return tagList;
	}

	/*
	 * @ApiOperation(value = "判断流程定义是否存在")
	 * 
	 * @ApiImplicitParams({ @ApiImplicitParam(name = "name", value = "流程定义名称",
	 * example = "流程名称"),
	 * 
	 * @ApiImplicitParam(name = "type_id", value = "流程类型ID", example = "doc_share"),
	 * 
	 * @ApiImplicitParam(name = "tenant_id", value = "流程租户ID", example = "workflow")
	 * })
	 * 
	 * @GetMapping(value = "/existence") public ExistenceVO exists(String name,
	 * String type_id, @RequestParam String tenant_id) { Boolean exists =
	 * processDefinitionService.exists(name, type_id, tenant_id); return
	 * ExistenceVO.builder().exists(exists).build(); }
	 */

	/*
	 * @ApiOperation(value = "判断流程是否执行过")
	 * 
	 * @ApiImplicitParam(name = "id", value = "流程定义ID", example =
	 * "Process_20YPUS2H:2:6ba69a8e-8648-11eb-b1e3-3614e324d3ec")
	 * 
	 * @GetMapping(value = "/{id}/record") public ExistenceVO
	 * processDefHasRecord(@PathVariable String id) { Boolean hasHistory =
	 * processModelService.processDefinitionHasHistory(id); return
	 * ExistenceVO.builder().exists(hasHistory).build(); }
	 */
}
