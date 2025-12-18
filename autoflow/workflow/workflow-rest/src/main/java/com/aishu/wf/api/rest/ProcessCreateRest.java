package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.ProcessDeploymentVO;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.model.CreateProcessDTO;
import com.aishu.wf.core.doc.service.ProcessCreateService;
import io.swagger.annotations.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/4/22 16:31
 */
@RestController
@RequestMapping(value = "/process-create")
@Api(tags = "流程新建")
public class ProcessCreateRest extends BaseRest {

    @Autowired
    ProcessCreateService processCreateService;

    @ApiOperation(value = "新建流程")
    @ApiImplicitParams({ @ApiImplicitParam(name = "createProcessDTO", value = "流程创建对象") })
    @ApiResponse(code = 200, message = "操作成功", response = ProcessDeploymentVO.class)
    @PostMapping(value = "", produces = "application/json; charset=UTF-8")
    public ProcessDeploymentVO deployment(@Valid @RequestBody CreateProcessDTO createProcessDTO) {
        String userId = this.getUserId();
        return ProcessDeploymentVO.builder().id(processCreateService.createNewProcess(createProcessDTO, userId)).build();
    }
}
