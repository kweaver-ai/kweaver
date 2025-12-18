package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.ExistenceVO;
import com.aishu.wf.api.model.config.ThirdAuditVO;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.service.ThirdAuditConfigService;
import com.aishu.wf.core.engine.core.model.dto.ThirdAuditConfigDTO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.Valid;
import java.util.List;

@Hidden
@Api(tags = "第三方审核")
@Slf4j
@RestController
@RequestMapping(value = "/third-audit", produces = "application/json")
public class ThirdAuditRest extends BaseRest {

    @Resource
    private ThirdAuditConfigService thirdAuditConfigService;

    @ApiOperation(value = "测试webhook回调地址连通性")
    @ApiImplicitParam(name = "webhook_url", value = "webhook回调地址", defaultValue = "a9ffcaf-8645-11eb-93b1-00ff1169f9ce")
    @PostMapping(value = "testWebhookConfig")
    public ExistenceVO testWebhookConfig(@RequestBody List<String> webhook_url) {
        return ExistenceVO.builder().exists(thirdAuditConfigService.testWebhookConfig(webhook_url.get(0))).build();
    }

    @ApiOperation(value = "获取第三方审核配置")
    @GetMapping(value = "")
    public ThirdAuditVO getThirdConfig() {
        return ThirdAuditVO.builder(thirdAuditConfigService.getThirdAuditConfig());
    }

    @OperationLog(title = OperationLogConstants.THIRD_AUDIT_LOG, level = OperationLogConstants.LogLevel.NCT_LL_NULL)
    @ResponseStatus(HttpStatus.CREATED)
    @ApiOperation(value = "保存第三方审核配置")
    @PostMapping(value = "")
    public void saveThirdConfig(@Valid @RequestBody ThirdAuditConfigDTO thirdAuditConfigDTO) {
        thirdAuditConfigService.saveThirdAuditConfig(thirdAuditConfigDTO);
    }

}
