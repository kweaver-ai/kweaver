package com.aishu.doc.audit.rest;

import com.aishu.wf.core.doc.model.dto.ThirdAuditNotificationDTO;
import com.aishu.wf.core.doc.service.ThirdAuditService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
/**
 * @description 第三方审核
 * @author ouandyang
 */
@Hidden
@Api(tags = "第三方审核")
@Slf4j
@RestController
@RequestMapping(value = "/third-audit")
public class ThirdAuditRest {

    @Resource
    private ThirdAuditService thirdAuditService;

    /**
     * @description 接收第三方审核回调结果通知
     * @author ouandyang
     * @param  notification
     * @updateTime 2021/5/13
     */
    @ApiOperation(value = "接收第三方审核回调结果通知")
    @PostMapping(value = "notification")
    public void notification(@RequestBody ThirdAuditNotificationDTO notification) {
    	thirdAuditService.sendAuditNotification(notification);
    }

}
