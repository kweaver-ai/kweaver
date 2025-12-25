package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.DocShareStrategyVO;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.ShareStrategyDTO;
import com.aishu.wf.core.doc.service.DocShareStrategyService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 审核策略服务
 * @author hanj
 */
@RestController
@RequestMapping(value = "/doc-share-strategy-internal")
@Api(tags = "审核策略")
public class DocShareStrategyRestInternal extends BaseRest {

	@Autowired
	private DocShareStrategyService docShareStrategyService;

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
}