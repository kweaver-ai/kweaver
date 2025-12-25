package com.aishu.wf.api.rest;

import java.util.HashMap;
import java.util.Map;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.NotFoundException;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.doc.model.dto.EmailSwitchDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;

import cn.hutool.core.util.StrUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

@RestController
@RequestMapping(value = "/email-switch")
@Api(tags = "邮件开关配置")
public class EmailSwitchRest extends BaseRest {

    @Autowired
    private DictService dictService;

    @ApiOperation(value = "邮件开关变更")
    @PutMapping(value = "", produces = "application/json; charset=UTF-8")
    public void updateSwitch(@Valid @RequestBody EmailSwitchDTO emailSwitchDTO) {
        if (StrUtil.isBlank(emailSwitchDTO.getType())){
            throw new RestException(BizExceptionCodeEnum.A400057001.getCode(),BizExceptionCodeEnum.A400057001.getMessage(), "type is empty");
        }
        if (!emailSwitchDTO.getStatus().equals("y") && !emailSwitchDTO.getStatus().equals("n")){
            throw new RestException(BizExceptionCodeEnum.A400057001.getCode(),BizExceptionCodeEnum.A400057001.getMessage(), "switch status can only be y or n");
        }
        Dict secretDict = dictService.findDictByCode(EmailSwitchDTO.buildDictName(emailSwitchDTO.getType()));
		if(null != secretDict){
			secretDict.setDictName(emailSwitchDTO.getStatus());
			dictService.updateById(secretDict);
		} else {
			dictService.save(EmailSwitchDTO.builderNewDict(emailSwitchDTO));
		}
    }

    @ApiOperation(value = "邮件开关状态查询")
	@GetMapping(value = "/{type}",produces = "application/json; charset=UTF-8")
	public Map<String, String> getSwitchInfo(@PathVariable String type) {
		Dict secretDict = dictService.findDictByCode(EmailSwitchDTO.buildDictName(type));
        if (secretDict == null) {
            throw new NotFoundException(BizExceptionCodeEnum.A404057003.getCode(), String.format("No email switch configuration information found, type: %s", type));
        }
        Map<String, String> result = new HashMap<>();
        result.put("status", secretDict.getDictName());
		return result;
	}
}