package com.aishu.wf.api.rest;

import java.util.ArrayList;
import java.util.List;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aishu.wf.api.model.config.FreeAuditDeptVO;
import com.aishu.wf.core.common.aspect.annotation.PageQuery;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.PageWrapper;
import com.aishu.wf.core.doc.model.FreeAuditConfigModel;
import com.aishu.wf.core.doc.model.FreeAuditModel;
import com.aishu.wf.core.doc.model.dto.FreeAuditConfigDTO;
import com.aishu.wf.core.doc.model.dto.FreeAuditDeptDTO;
import com.aishu.wf.core.doc.model.dto.FreeAuditDeptQueryDTO;
import com.aishu.wf.core.doc.service.FreeAuditConfigService;
import com.aishu.wf.core.doc.service.FreeAuditService;
import com.baomidou.mybatisplus.core.metadata.IPage;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;

@Api(tags = "自动审核（密级）")
@Slf4j
@RestController
@RequestMapping(value = "/free-audit", produces = "application/json")
public class FreeAuditRest extends BaseRest {

    @Autowired
    FreeAuditService freeAuditService;

    @Autowired
    FreeAuditConfigService configService;

    @ApiOperation(value = "查看自动审核（密级）配置")
    @GetMapping(value = "")
    public FreeAuditConfigModel getConfig() {
        return configService.getConfig();
    }

    @ApiOperation(value = "修改自动审核（密级）配置")
    @PutMapping(value = "")
    @ApiImplicitParam(name = "config", value = "自动审核（密级）配置")
    public void saveConfig(@Validated @RequestBody FreeAuditConfigDTO config) {
        configService.saveConfig(config.buildFreeAuditConfigModel());
    }

    @PageQuery
    @ApiOperation(value = "获取改自动审核（密级）列表")
    @GetMapping(value = "department")
    public PageWrapper<FreeAuditDeptVO> pageSearchFreeAuditDept(@Valid @ApiParam(value="搜索字符(不传则代表查询所有)")
                                                                        FreeAuditDeptQueryDTO search) {
        IPage<FreeAuditModel> pageData = freeAuditService.pageSearchFreeAuditDept(search);
        List<FreeAuditDeptVO> listVo = new ArrayList<FreeAuditDeptVO>();
        for (FreeAuditModel deptBean : pageData.getRecords()){
            listVo.add(new FreeAuditDeptVO(deptBean.getId(),deptBean.getDepartmentName()));
        }
        return new PageWrapper<FreeAuditDeptVO>(listVo, (int) pageData.getTotal());
    }

    @ApiOperation(value = "添加改自动审核（密级）部门")
    @PostMapping(value = "department",produces = "application/json; charset=UTF-8")
    public void saveFreeAuditVo(@ApiParam(value="免审记录传入数据",required = true)
                                     @Validated @RequestBody List<FreeAuditDeptDTO> detps) {
        freeAuditService.saveFreeAuditVos(detps, "p_longw");
    }

    @ApiOperation(value = "删除改自动审核（密级）部门")
    @DeleteMapping(value = "department/{ids}")
    public void deleteFreeAuditById(@ApiParam(value="自动审核记录id，多个id以,分隔",required = true) @PathVariable String ids) {
        freeAuditService.deleteFreeAuditByIds(ids);
    }

}