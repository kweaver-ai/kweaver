package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.ProcessInfoConfigVO;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/process-def")
@Api(tags = "流程定义-对外提供内部调用接口服务")
public class ProcessDefRest extends BaseRest {

	@Autowired
	private ProcessDefinitionService processDefinitionService;

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

}
