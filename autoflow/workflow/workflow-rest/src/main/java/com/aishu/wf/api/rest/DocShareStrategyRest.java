package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.CheckDocShareStrategyVO;
import com.aishu.wf.api.model.DocShareStrategyVO;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.CheckDocShareStrategyDTO;
import com.aishu.wf.core.doc.model.dto.DocShareStrategyDTO;
import com.aishu.wf.core.doc.model.dto.ShareStrategyDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.aishu.wf.core.engine.config.service.DictService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.v3.oas.annotations.Hidden;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 审核策略服务
 * @author hanj
 */
@RestController
@RequestMapping(value = "/doc-share-strategy")
@Api(tags = "审核策略")
public class DocShareStrategyRest extends BaseRest {

	@Autowired
	private DocShareStrategyService docShareStrategyService;

	@Autowired
	private DictService dictService;

	@ApiOperation(value = "分页获取审核策略")
	@PageQuery
	@GetMapping(value = "")
	public PageWrapper<DocShareStrategyVO> page(
			@ApiParam(name = "queryDTO", value = "审核策略查询对象") @Valid ShareStrategyDTO queryDTO) {
		IPage<DocShareStrategy> page = docShareStrategyService.findDocShareStrategyPage(queryDTO);
		List<DocShareStrategyVO> docShareStrategyVOList = page.getRecords().stream().map(DocShareStrategyVO::builder)
				.collect(Collectors.toList());
		return new PageWrapper<DocShareStrategyVO>(docShareStrategyVOList, (int) page.getTotal());
	}

	@ApiOperation(value = "保存审核策略")
	@PostMapping(value = "/{proc_def_id}",produces = "application/json; charset=UTF-8")
	public void saveStrategy(@ApiParam(value="审核策略集合",required = true)
								@Validated @RequestBody List<DocShareStrategyDTO> docShareStrategyDTOList, @PathVariable String proc_def_id) {
		List<DocShareStrategy> shareStrategyList = docShareStrategyDTOList.stream().map(DocShareStrategyDTO::builderModel)
				.collect(Collectors.toList());
		docShareStrategyService.saveDocAuditStrategy(proc_def_id, WorkflowConstants.SHARE_PROCESS.getName(proc_def_id), this.getUserId(), shareStrategyList, true, CommonConstants.TENANT_AS_WORKFLOW);
	}

	@ApiOperation(value = "批量修改审核策略")
	@PutMapping(value = "/{proc_def_id}/batch",produces = "application/json; charset=UTF-8")
	public void updateBatchStrategy(@ApiParam(value="审核策略集合",required = true)
									   @Validated @RequestBody List<DocShareStrategyDTO> docShareStrategyDTOList, @PathVariable String proc_def_id) {
		List<DocShareStrategy> shareStrategyList = docShareStrategyDTOList.stream().map(DocShareStrategyDTO::builderModel)
				.collect(Collectors.toList());
		docShareStrategyService.updateDocAuditStrategy(shareStrategyList, proc_def_id, this.getUserId());
	}

	@ApiOperation(value = "批量删除审核策略")
	@DeleteMapping(value = "",produces = "application/json; charset=UTF-8")
	public void deleteBatchStrategy(@ApiParam(value="策略id集合",required = true)@RequestBody List<String> idList) {
		docShareStrategyService.deleteDocAuditStrategy(idList);
	}

	@ApiOperation(value = "校验审核策略")
	@PostMapping(value = "/{proc_def_id}/check",produces = "application/json; charset=UTF-8")
	public List<CheckDocShareStrategyVO> checkStrategy(@ApiParam(value="文档库id集合",required = true)
									@Validated @RequestBody List<CheckDocShareStrategyDTO> docList, @PathVariable String proc_def_id) {
		List<CheckDocShareStrategyDTO> list = docShareStrategyService.checkAuditStrategy(docList, proc_def_id);
		return list.stream().map(CheckDocShareStrategyVO::builder).collect(Collectors.toList());
	}

	@Hidden
	@ApiOperation(value = "保存共享加签策略")
	@PostMapping(value = "/countersign/{process_def_key}",produces = "application/json; charset=UTF-8")
	public void saveShareCountersignStrategy(@ApiParam(value="审核策略",required = true)
							 @Validated @RequestBody DocShareStrategyDTO docShareStrategyDTO, @PathVariable String process_def_key) {
		dictService.saveShareCountersignStrategy(docShareStrategyDTO, process_def_key);

	}

	@Hidden
	@ApiOperation(value = "获取共享加签策略")
	@GetMapping(value = "/countersign/{process_def_key}")
	public DocShareStrategyVO getShareCountersignStrategy(@PathVariable String process_def_key) {
		DocShareStrategy shareStrategy = dictService.getShareCountersignStrategy(process_def_key);
		return DocShareStrategyVO.builder(shareStrategy);
	}

	@Hidden
	@ApiOperation(value = "保存共享高级设置策略")
	@PostMapping(value = "/advanced-config/{process_def_key}",produces = "application/json; charset=UTF-8")
	public void saveShareAdvancedConfigStrategy(@ApiParam(value="审核策略",required = true)
							 @Validated @RequestBody DocShareStrategyDTO docShareStrategyDTO, @PathVariable String process_def_key) {
		dictService.saveShareAdvancedConfigStrategy(docShareStrategyDTO, process_def_key);
	}

	@Hidden
	@ApiOperation(value = "获取共享高级设置策略")
	@GetMapping(value = "/advanced-config/{process_def_key}")
	public DocShareStrategyVO getShareAdvancedConfigStrategy(@PathVariable String process_def_key) {
		DocShareStrategy shareStrategy = dictService.getShareAdvancedConfigStrategy(process_def_key);
		return DocShareStrategyVO.builder(shareStrategy);
	}
}
