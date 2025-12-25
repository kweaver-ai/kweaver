package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.BeansBuilder;
import com.aishu.wf.api.model.ProcessInstanceVO;
import com.aishu.wf.api.model.ProcessTraceLogVO;
import com.aishu.wf.api.service.ProcessInstanceLogService;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.TransferInfo;
import com.aishu.wf.core.doc.service.CountersignInfoService;
import com.aishu.wf.core.doc.service.TransferInfoService;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceLog;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.aishu.wf.core.engine.core.service.WorkFlowClinetService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Hidden;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * @description 流程实例
 * @author hanj
 */
@Api(tags = "流程实例")
@RestController
@RequestMapping(value = "process-instance")
public class ProcessInstanceRest extends BaseRest {

	@Autowired
	private WorkFlowClinetService workFlowService;
	@Autowired
	private BeansBuilder beansBuilder;
	@Autowired
	private ProcessInstanceLogService processInstanceLogService;

	/**
	 * @description 流程作废
	 * @author hanj
	 * @param  id
	 * @param  sender
	 * @param  comment
	 * @updateTime 2021/5/13
	 */
	@ApiOperation(value = "流程作废")
	@Hidden
	@DeleteMapping(value = "/{id}", produces = "application/json; charset=UTF-8")
	public void cancel(@PathVariable String id,@RequestParam(required = false) String comment) {
		workFlowService.cancel(id,this.getUserId(), comment);
	}

	/**
	 * @description 获取流程日志
	 * @author hanj
	 * @param  id
	 * @updateTime 2021/5/13
	 */
	@ApiOperation(value = "获取流程日志")
	@ApiImplicitParams({ @ApiImplicitParam(name = "id", value = "流程实例ID"), })
	@GetMapping(value = "{id}/logs", produces = "application/json; charset=UTF-8")
	public List<ProcessTraceLogVO> getProcTextLogs(@PathVariable String id) {
		return processInstanceLogService.getProcTextLogs(id);
	}



	/**
	 * @description 创建流程（新建暂存）
	 * @author hanj
	 * @param  model
	 * @updateTime 2021/5/13
	 */
	@Hidden
	@ApiOperation(value = "发起流程(流转至第一个环节)")
	@PutMapping(value = "", produces = "application/json; charset=UTF-8")
	public ProcessInstanceVO create(@RequestBody ProcessInputModel model) {
		ProcessInstanceModel processInstanceModel = workFlowService.create(model);
		return beansBuilder.build(processInstanceModel);
	}

	/**
	 * @description 流程执行
	 * @author hanj
	 * @param  model
	 * @updateTime 2021/5/13
	 */
	@Hidden
	@ApiOperation(value = "流程执行(流转至下一环节)")
	@PostMapping(value = "", produces = "application/json; charset=UTF-8")
	public ProcessInstanceVO execute(@RequestBody ProcessInputModel model) {
		ProcessInstanceModel processInstanceModel = workFlowService.nextExcute(model);
		return beansBuilder.build(processInstanceModel);
	}
}
