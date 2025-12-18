package com.aishu.doc.audit.rest;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.model.dto.DocAuditApplyDTO;
import com.aishu.doc.audit.model.dto.DocAuditHistoryDTO;
import com.aishu.doc.audit.model.dto.DocAuditTaskDTO;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.vo.DocAuditApplyListVO;
import com.aishu.doc.audit.vo.DocAuditCountVO;
import com.aishu.doc.audit.vo.DocAuditListVO;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.doc.common.DocConstants;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 文档审核
 * @author ouandyang
 */
@Slf4j
@Validated
@RestController
@Api(tags = "文档审核")
@RequestMapping("/doc-audit")
public class DocAuditListRest extends BaseRest {
	@Autowired
	DocAuditApplyService docAuditApplyService;
	@Autowired
	DocAuditHistoryService docAuditHistoryService;
	@Autowired
	AuditConfig auditConfig;

	/**
	 * @description 获取我的申请列表
	 * @author ouandyang
	 * @param  docAuditApplyDto 查询对象
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取我的申请列表")
	@GetMapping(value = "/applys", produces = "application/json; charset=UTF-8")
	public PageWrapper<DocAuditApplyListVO> applys(
			@Valid @ApiParam(name = "docAuditApplyDto", value = "查询对象") DocAuditApplyDTO docAuditApplyDto){
		IPage<DocAuditHistoryModel> page = docAuditHistoryService.selectMyApplyList(docAuditApplyDto, this.getUserId());
		List<DocAuditApplyListVO> list = page.getRecords().stream().map(item ->
				DocAuditApplyListVO.builder(item, auditConfig)
		).collect(Collectors.toList());
		return new PageWrapper<DocAuditApplyListVO>(list, (int) page.getTotal());
	}

	/**
	 * @description 获取我的待办列表
	 * @author ouandyang
	 * @param  docAuditTaskDto 查询对象
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取我的待办列表")
	@GetMapping(value = "/tasks", produces = "application/json; charset=UTF-8")
	public PageWrapper<DocAuditListVO> task(
			@Valid @ApiParam(name = "docAuditTaskDto", value = "待办查询对象") DocAuditTaskDTO docAuditTaskDto){
		return docAuditApplyService.listTasks(docAuditTaskDto, this.getUserId());
	}


	/**
	 * @description 获取我的已办列表
	 * @author ouandyang
	 * @param  docAuditHistoryDto 查询对象
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取我处理的列表")
	@GetMapping(value = "/historys", produces = "application/json; charset=UTF-8")
	public PageWrapper<DocAuditListVO> history(
			@Valid @ApiParam(name = "docAuditHistoryDto", value = "我处理的查询对象") DocAuditHistoryDTO docAuditHistoryDto){
		docAuditHistoryDto.setStatus(DocConstants.AUDIT_STATUS_PASS.equals(docAuditHistoryDto.getStatus()) ? DocConstants.AUDIT_STATUS_DONE_PASS : docAuditHistoryDto.getStatus());
		IPage<DocAuditHistoryModel> page = docAuditHistoryService.selectDoneApplyList(docAuditHistoryDto, this.getUserId());
		List<DocAuditListVO> list = page.getRecords().stream().map(item ->
				DocAuditListVO.builder(item, auditConfig)
		).collect(Collectors.toList());
		return new PageWrapper<DocAuditListVO>(list, (int) page.getTotal());
	}

	/**
	 * @description 获取我的待办条目
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取我的待办条目")
	@GetMapping(value = "/tasks/count", produces = "application/json; charset=UTF-8")
	public DocAuditCountVO taskCount(){
		int count = docAuditApplyService.selectTodoApplyCount(this.getUserId());
		return DocAuditCountVO.builder().count(count).build();
	}

	/**
	 * @description 获取我的审核条目
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	@PageQuery
	@ApiOperation(value = "获取我的审核条目")
	@GetMapping(value = "/audits/count", produces = "application/json; charset=UTF-8")
	public DocAuditCountVO auditsCount(){
		int count = docAuditHistoryService.selectAuditCount(this.getUserId());
		return DocAuditCountVO.builder().count(count).build();
	}

}
