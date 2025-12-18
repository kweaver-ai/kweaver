package com.aishu.wf.api.rest;

import com.aishu.wf.api.model.SecretVO;
import com.aishu.wf.core.common.model.BaseRest;
import com.aishu.wf.core.doc.model.dto.SecretDTO;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * @description 涉密配置服务
 * @author hanj
 */
@RestController
@RequestMapping(value = "/secret-config")
@Api(tags = "涉密配置")
public class SecretRest extends BaseRest {

	@Autowired
	private DictService dictService;

	@ApiOperation(value = "涉密模式配置变更")
	@PutMapping(value = "",produces = "application/json; charset=UTF-8")
	public void updateSecret(@RequestBody SecretDTO secretDTO) {
		Dict secretDict = dictService.findDictByCode(SecretDTO.DICT_SECRET_SWITCH);
		if(null != secretDict){
			secretDict.setDictName(secretDTO.getStatus());
			dictService.updateById(secretDict);
		} else {
			dictService.save(SecretDTO.builderNewDict(secretDTO));
		}
	}

	@ApiOperation(value = "涉密模式配置查询")
	@GetMapping(value = "/info",produces = "application/json; charset=UTF-8")
	public SecretVO getSecret() {
		Dict secretDict = dictService.findDictByCode(SecretDTO.DICT_SECRET_SWITCH);
		return SecretVO.builder(secretDict);
	}

}
