package com.aishu.wf.core.doc.model.dto;

import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Size;

@ApiModel(value = "文档共享审核策略-审核员参数对象")
@Data
public class DocShareStrategyAuditorDTO {

    @ApiModelProperty(value = "主键")
    private String id;

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

    @ApiModelProperty(value = "审核策略ID")
    @Size(max = 50,message = "审核策略ID不能超过50")
    private String audit_strategy_id;

    @ApiModelProperty(value = "排序", required = true)
    @Max(value = 100,message = "排序太大")
    private Integer audit_sort;

    @ApiModelProperty(value = "类型")
    @Max(value = 32,message = "用户类型长度不能超过32")
    private String org_type;

    public static DocShareStrategyAuditorDTO builder(DocShareStrategyAuditor docShareStrategyAuditor) {
        DocShareStrategyAuditorDTO auditorDTO = new DocShareStrategyAuditorDTO();
        auditorDTO.setId(docShareStrategyAuditor.getId());
        auditorDTO.setUser_id(docShareStrategyAuditor.getUserId());
        auditorDTO.setUser_code(docShareStrategyAuditor.getUserCode());
        auditorDTO.setUser_name(docShareStrategyAuditor.getUserName());
        auditorDTO.setUser_dept_id(docShareStrategyAuditor.getUserDeptId());
        auditorDTO.setUser_dept_name(docShareStrategyAuditor.getUserDeptName());
        auditorDTO.setAudit_strategy_id(docShareStrategyAuditor.getAuditStrategyId());
        auditorDTO.setAudit_sort(docShareStrategyAuditor.getAuditSort());
        auditorDTO.setOrg_type(docShareStrategyAuditor.getOrgType());
        return auditorDTO;
    }

    public static DocShareStrategyAuditor builderModel(DocShareStrategyAuditorDTO auditorDTO) {
        DocShareStrategyAuditor auditor = new DocShareStrategyAuditor();
        auditor.setId(auditorDTO.getId());
        auditor.setUserId(auditorDTO.getUser_id());
        auditor.setUserCode(auditorDTO.getUser_code());
        auditor.setUserName(auditorDTO.getUser_name());
        auditor.setUserDeptId(auditorDTO.getUser_dept_id());
        auditor.setUserDeptName(auditorDTO.getUser_dept_name());
        auditor.setAuditStrategyId(auditorDTO.getAudit_strategy_id());
        auditor.setAuditSort(auditorDTO.getAudit_sort());
        auditor.setOrgType(auditorDTO.getOrg_type());
        return auditor;
    }

}
