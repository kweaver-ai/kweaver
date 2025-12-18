package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.DeptAuditRuleVO;
import com.aishu.wf.api.model.DeptAuditorRuleRoleVO;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.doc.service.DeptAuditorRuleService;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleDTO;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleQueryDTO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 部门审核员规则服务
 * @author hanj
 */
@RestController
@RequestMapping(value = "/dept-auditor-rule")
@Api(tags = "部门审核员规则服务")
public class DeptAuditorRuleRest extends BaseRest {

	@Autowired
	private DeptAuditorRuleService deptAuditorRuleService;

	@ApiOperation(value = "分页获取部门审核员规则")
	@PageQuery
	@GetMapping(value = "")
	public PageWrapper<DeptAuditorRuleRoleVO> page(
			@ApiParam(name = "queryDTO", value = "部门审核员规则查询对象") @Valid DeptAuditorRuleRoleQueryDTO queryDTO) {
		IPage<Role> page = deptAuditorRuleService.findDeptAuditorRulePage(queryDTO, this.getUserId());
		List<DeptAuditorRuleRoleVO> deptAuditorRuleVOList = page.getRecords().stream().map(DeptAuditorRuleRoleVO::builder)
				.collect(Collectors.toList());
		return new PageWrapper<DeptAuditorRuleRoleVO>(deptAuditorRuleVOList, (int) page.getTotal());
	}

	@ApiOperation(value = "部门审核员规则信息")
	@ApiImplicitParam(name = "ruleId", value = "规则ID")
	@GetMapping(value = "/{ruleId}")
	public DeptAuditorRuleRoleVO getDeptAuditorRule(@PathVariable String ruleId) {
		Role role = deptAuditorRuleService.getDeptAuditorRule(ruleId);
		return DeptAuditorRuleRoleVO.builderDetail(role);
	}

	@ApiOperation(value = "保存部门审核员规则")
	@PostMapping(value = "",produces = "application/json; charset=UTF-8")
	public DeptAuditRuleVO saveStrategy(@ApiParam(value="部门审核员规则集合",required = true)
								@Validated @RequestBody DeptAuditorRuleRoleDTO deptAuditorRuleRoleDTO) {
		return DeptAuditRuleVO.builder()
				.id(deptAuditorRuleService.saveDeptAuditorRule(deptAuditorRuleRoleDTO, this.getUserId())).build();
	}

	@ApiOperation(value = "批量删除部门审核员规则")
	@DeleteMapping(value = "",produces = "application/json; charset=UTF-8")
	public void deleteBatchStrategy(@ApiParam(value="策略id集合",required = true)@RequestBody List<String> idList) {
		deptAuditorRuleService.deleteDeptAuditorRule(idList);
	}

}
