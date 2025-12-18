package com.aishu.doc.audit.rest;

import com.aishu.doc.audit.common.DocAuditSubmitService;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.doc.common.DocConstants;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @description 文档审核
 * @author ouandyang
 */
@Slf4j
@Validated
@RestController
@Api(tags = "文档审核-对外提供内部调用接口服务")
@RequestMapping("/doc-audit-inside")
public class DocAuditInsideRest extends BaseRest {

	@Autowired
	DocAuditSubmitService docAuditSubmitService;

	@PageQuery
	@ApiOperation(value = "撤销申请")
	@ApiImplicitParam(name = "apply_id", value = "申请ID")
	@ApiImplicitParams({ @ApiImplicitParam(name = "apply_id", value = "申请ID")})
	@DeleteMapping(value = "/{apply_id}", produces = "application/json; charset=UTF-8")
	public void cancel(@PathVariable String apply_id){
		docAuditSubmitService.revocationByApplyId(apply_id, null, DocConstants.DELETE_REASON_REVOCATION);
	}

}
