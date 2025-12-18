package com.aishu.wf.core.common.model;

import com.aishu.wf.core.doc.model.dto.DocShareStrategyAuditorDTO;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Size;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/4/22 18:00
 */
@Data
public class CreateStrategyAuditorDTO {

    @ApiModelProperty(value = "用户ID", required = true)
    @Size(max = 100,message = "用户ID不能超过100")
    private String user_id;

    @ApiModelProperty(value = "用户账号", required = true)
    @Size(max = 100,message = "用户账号不能超过100")
    private String user_code;

    @ApiModelProperty(value = "用户名称", required = true)
    @Size(max = 100,message = "用户名称不能超过100")
    private String user_name;

    @ApiModelProperty(value = "用户部门ID", required = true)
    @Size(max = 100,message = "用户部门ID不能超过100")
    private String user_dept_id;

    @ApiModelProperty(value = "用户部门名称", required = true)
    @Size(max = 100,message = "用户部门名称不能超过100")
    private String user_dept_name;

    @ApiModelProperty(value = "审核策略ID", hidden = true)
    @Size(max = 50,message = "审核策略ID不能超过50")
    private String audit_strategy_id;

    @ApiModelProperty(value = "排序", required = true)
    @Max(value = 100,message = "排序太大")
    private Integer audit_sort;

    public static DocShareStrategyAuditorDTO builder(CreateStrategyAuditorDTO createStrategyAuditorDTO) {
        DocShareStrategyAuditorDTO auditorDTO = new DocShareStrategyAuditorDTO();
        auditorDTO.setAudit_sort(createStrategyAuditorDTO.getAudit_sort());
        auditorDTO.setAudit_strategy_id(createStrategyAuditorDTO.getAudit_strategy_id());
        auditorDTO.setUser_code(createStrategyAuditorDTO.getUser_code());
        auditorDTO.setUser_dept_id(createStrategyAuditorDTO.getUser_dept_id());
        auditorDTO.setUser_dept_name(createStrategyAuditorDTO.getUser_dept_name());
        auditorDTO.setUser_id(createStrategyAuditorDTO.getUser_id());
        auditorDTO.setUser_name(createStrategyAuditorDTO.getUser_name());
        return auditorDTO;
    }
}
