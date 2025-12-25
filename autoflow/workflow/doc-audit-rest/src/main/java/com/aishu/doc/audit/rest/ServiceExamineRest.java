package com.aishu.doc.audit.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @description 服务检查
 * @author ouandyang
 */
@Slf4j
@Validated
@RestController
@Api(tags = "服务状态检查")
@RequestMapping("/ping")
public class ServiceExamineRest {

	/**
	 * @description 服务状态检查
	 * @author ouandyang
	 * @updateTime 2021/6/3
	 */
	@ApiOperation(value = "服务状态健康检查", notes = "判断workflow服务是否可用；用于客户端集成workflow，当响应码为200时客户端展示workflow图标")
	@GetMapping(value = "")
	public void ping(){}
}
