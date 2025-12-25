package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.AsUserVO;
import com.aishu.wf.api.model.DeptAuditorQueryVO;
import com.aishu.wf.api.model.TriSystemStatusVO;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.anyshare.thrift.service.SharemgntThriftService;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.ValueObjectEntity;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.service.DeptAuditorRuleService;
import com.aishu.wf.core.engine.identity.model.User2role;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleRoleQueryDTO;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.aishu.wf.core.thrift.sharemgnt.ncTUsrmDepartmentInfo;
import com.aishu.wf.core.thrift.sharemgnt.ncTUsrmGetUserInfo;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Hidden
@Api(tags = "用户组织架构管理")
@Slf4j
@RestController
@RequestMapping(value = CommonConstants.API_VERSION_V1 + "/user-management", produces = "application/json")
@Validated
public class UserManagementRest extends BaseRest {

	@Resource
	private UserManagementService userManagementService;

	@Resource
	private SharemgntThriftService sharemgntThriftService;

	@Autowired
	private DeptAuditorRuleService deptAuditorRuleService;


	@ApiOperation(value = "批量转换用户显示名、部门名")
	@ApiImplicitParams({
			@ApiImplicitParam(name = "type", value = "类型（user:用户、department：部门）", required = true),
			@ApiImplicitParam(name = "ids", value = "ID集合")
	})

	@PostMapping("names")
	public List<ValueObjectEntity> names(@NotNull @ArrayValuable(values = {"user", "department", "group"}, message = "type必须为【user，department，group】中的值")
											 @RequestParam String type, @RequestBody List<String> ids) {
		return userManagementService.namesWithExcepteion(type, ids);
	}

	@ApiOperation(value = "批量获取用户信息")
	@ApiImplicitParams({@ApiImplicitParam(name = "ids", value = "ID集合")})
	@PostMapping("users")
	public List<AsUserVO> names(@RequestBody List<String> ids) {
		List<AsUserVO> userList = new ArrayList<>();
		for (String userId : ids) {
			User user = null;
			try {
				user = userManagementService.getUserInfoById(userId);
			} catch (Exception e) {
				e.printStackTrace();
			}
			if(user != null){
				userList.add(AsUserVO.buildAsUserVO(user, userId));
			}
		}

		return userList;
	}

	@PageQuery
	@ApiOperation(value = "搜索部门审核员规则审核员信息")
	@GetMapping("dept-auditor-search")
	public List<DeptAuditorQueryVO> names(DeptAuditorRuleRoleQueryDTO queryDTO) {
		List<User2role> user2roleList = deptAuditorRuleService.queryAuditorsByName(queryDTO.getId(), queryDTO.getNames(), queryDTO.getAuditors());
		Map<String, List<User2role>> highestLevelUserMap = user2roleList.stream().collect(Collectors.groupingBy(User2role::getOrgId));
		List<DeptAuditorQueryVO> deptAuditorQueryVOList = new ArrayList<>();
		for(String orgId : highestLevelUserMap.keySet()){
			DeptAuditorQueryVO deptAuditorQueryVO = new DeptAuditorQueryVO();
			List<AsUserVO> asUserVOList = new ArrayList<>();
			List<ValueObjectEntity> orgEntityList = userManagementService.namesWithExcepteion("department", Arrays.asList(orgId));
			List<String> userIds = user2roleList.stream().map(User2role::getUserId).collect(Collectors.toList());
			for (String userId : userIds) {
				try {
					User user = userManagementService.getUserInfoById(userId);
					asUserVOList.add(AsUserVO.buildAsUserVO(user, userId));
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
			deptAuditorQueryVO.setOrgId(orgId);
			deptAuditorQueryVO.setOrgName(orgEntityList.size() > 0 ? orgEntityList.get(0).getName() : "");
			deptAuditorQueryVO.setAsUserVOList(asUserVOList);
			deptAuditorQueryVOList.add(deptAuditorQueryVO);
		}
		return deptAuditorQueryVOList;
	}

	@ApiOperation(value = "三权分立是否开启")
	@GetMapping(value = "/tri-system-status")
	public TriSystemStatusVO getTriSystemStatus() {
		boolean result = sharemgntThriftService.getTriSystemStatus();
		return TriSystemStatusVO.builder(result);
	}

	@ApiOperation(value = "批量根据部门ID(组织ID)获取部门（组织）父路经")
	@PostMapping(value = "/department-parent-path")
	public List<ncTUsrmDepartmentInfo> getDepartmentParentPath(@RequestBody List<String> departIds) {
		List<ncTUsrmDepartmentInfo> result = sharemgntThriftService.getDepartmentParentPath(departIds);
		return result;
	}

	@ApiOperation(value = "根据用户id获取详细信息")
	@GetMapping(value = "/usrm-get-user-info/{id}")
	public ncTUsrmGetUserInfo usrmGetUserInfo(@PathVariable String id) {
		ncTUsrmGetUserInfo result = sharemgntThriftService.usrmGetUserInfo(id);
		return result;
	}

}
