package com.aishu.doc.audit.rest;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.service.DocAuditReminderService;
import com.aishu.doc.audit.vo.DocAuditReminderParam;
import com.aishu.doc.audit.vo.ReminderVO;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.NotFoundException;
import com.aishu.wf.core.common.model.BaseRest;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;

/**
 * @description 审核催办
 * @author siyu.chen
 */
@Slf4j
@Validated
@RestController
@Api(tags = "文档审核")
@RequestMapping("/doc-audit")
public class DocAuditReminderRest  extends BaseRest {
    @Autowired
    DocAuditHistoryService docAuditHistoryService;
    @Autowired
    DocAuditReminderService docAuditReminderService;

    @ApiOperation(value = "审核催办")
    @ApiImplicitParam(name = "id", value = "申请ID")
    @PostMapping(value = "/{id}/reminder", produces = "application/json; charset=UTF-8")
    public void reminder(@PathVariable String id, @Valid @RequestBody DocAuditReminderParam docAuditReminderParam) {
        DocAuditHistoryModel docAuditHistoryModel;
        if (docAuditReminderParam.getIs_arbitrary() != null && docAuditReminderParam.getIs_arbitrary()) {
            docAuditHistoryModel = docAuditHistoryService.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getBizId, id)
            .eq(DocAuditHistoryModel::getApplyUserId,this.getUserId()));
        } else {
            docAuditHistoryModel = docAuditHistoryService.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getId, id)
            .eq(DocAuditHistoryModel::getApplyUserId,this.getUserId()));
        }
        if (docAuditHistoryModel == null) {
            String detail = String.format("该审核详情不存在, id: %s", id);
            throw new NotFoundException(BizExceptionCodeEnum.A404057001.getCode(), BizExceptionCodeEnum.A404057001.getMessage(), detail);
        }
        docAuditReminderService.reminder(docAuditHistoryModel, docAuditReminderParam);
    }

    @ApiOperation(value = "获取审核催办状态")
    @ApiImplicitParam(name = "id", value = "申请ID")
    @GetMapping(value = "/{id}/reminder-status", produces = "application/json; charset=UTF-8")
    public ReminderVO reminderStatus(@PathVariable String id, @RequestParam(name = "is_arbitrary", defaultValue = "false", required = false) Boolean isArbitrary) {
        DocAuditHistoryModel docAuditHistoryModel;
        if (isArbitrary) {
            docAuditHistoryModel = docAuditHistoryService.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getBizId,id)
            .eq(DocAuditHistoryModel::getApplyUserId,this.getUserId()));
        } else {
            docAuditHistoryModel = docAuditHistoryService.getOne(new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getId,id)
            .eq(DocAuditHistoryModel::getApplyUserId,this.getUserId()));
        }
        if (docAuditHistoryModel == null) {
            String detail = String.format("该审核详情不存在, id: %s", id);
            throw new NotFoundException(BizExceptionCodeEnum.A404057001.getCode(), BizExceptionCodeEnum.A404057001.getMessage(), detail);
        }
        return docAuditReminderService.reminderStatus(docAuditHistoryModel);
    }
}
