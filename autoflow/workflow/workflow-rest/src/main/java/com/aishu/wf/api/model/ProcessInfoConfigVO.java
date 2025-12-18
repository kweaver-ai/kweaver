package com.aishu.wf.api.model;

import cn.hutool.core.date.DateUtil;
import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.engine.config.model.ProcessInfoConfig;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import static cn.hutool.core.date.DatePattern.UTC_PATTERN;

@Data
@ApiModel(value = "流程定义对象")
public class ProcessInfoConfigVO {

    @ApiModelProperty(value = "流程定义ID", example = "Process_QM57BLUS:5:c1084fd3-7cc9-11eb-8bb9-00ff1601c9e0")
    private String id;

    @ApiModelProperty(value = "流程定义KEY", example = "Process_QM57BLUS")
    private String key;

    @ApiModelProperty(value = "流程名称", example = "共享审核流程")
    private String name;

    @ApiModelProperty(value = "流程类型", example = "doc_share")
    private String type;

    @ApiModelProperty(value = "流程类型名称", example = "文档共享审核")
    private String type_name;

    @ApiModelProperty(value = "创建时间", example = "2021-03-04T10:39:08Z")
    private String create_time;

    @ApiModelProperty(value = "创建人", example = "张三")
    private String create_user_name;

    @ApiModelProperty(value = "租户ID", example = "as_workflow")
    private String tenant_id;

    @ApiModelProperty(value = "流程说明", example = "--")
    private String description;

    @ApiModelProperty(value = "是否有效（0：有效；1：无效）", example = "0")
    private Integer effectivity;

    public static ProcessInfoConfigVO builder(ProcessInfoConfig processInfoConfig) {
        ProcessInfoConfigVO processInfoConfigVO = new ProcessInfoConfigVO();
        if(null == processInfoConfig){
            throw new RestException(BizExceptionCodeEnum.A404001001.getCode(),
                    BizExceptionCodeEnum.A404001001.getMessage());
        }
        processInfoConfigVO.setId(processInfoConfig.getProcessDefId());
        processInfoConfigVO.setKey(processInfoConfig.getProcessDefKey());
        processInfoConfigVO.setName(processInfoConfig.getProcessDefName());
        processInfoConfigVO.setType(processInfoConfig.getProcessTypeId());
        processInfoConfigVO.setType_name(processInfoConfig.getProcessTypeName());
        processInfoConfigVO.setTenant_id(processInfoConfig.getTenantId());
        processInfoConfigVO.setCreate_time(DateUtil.format(processInfoConfig.getCreateTime(), UTC_PATTERN));
        processInfoConfigVO.setDescription(processInfoConfig.getRemark());
        processInfoConfigVO.setCreate_user_name(processInfoConfig.getCreateUserName());
        return processInfoConfigVO;
    }

}
