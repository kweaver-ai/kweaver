package com.aishu.wf.api.model;

import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@ApiModel(value = "文档共享审核策略-审核员对象")
@Data
public class DocShareStrategyAuditorVO {

    @ApiModelProperty(value = "主键")
    private String id;

    @ApiModelProperty(value = "用户ID")
    private String user_id;

    @ApiModelProperty(value = "用户账号")
    private String user_code;

    @ApiModelProperty(value = "用户名称")
    private String user_name;

    @ApiModelProperty(value = "用户部门ID")
    private String user_dept_id;

    @ApiModelProperty(value = "用户部门名称")
    private String user_dept_name;

    @ApiModelProperty(value = "审核策略ID")
    private String audit_strategy_id;

    @ApiModelProperty(value = "排序")
    private Integer audit_sort;

    public static DocShareStrategyAuditorVO builder(DocShareStrategyAuditor docShareStrategyAuditor) {
        DocShareStrategyAuditorVO auditorVO = new DocShareStrategyAuditorVO();
        auditorVO.setId(docShareStrategyAuditor.getId());
        auditorVO.setUser_id(docShareStrategyAuditor.getUserId());
        auditorVO.setUser_code(docShareStrategyAuditor.getUserCode());
        auditorVO.setUser_name(docShareStrategyAuditor.getUserName());
        auditorVO.setUser_dept_id(docShareStrategyAuditor.getUserDeptId());
        auditorVO.setUser_dept_name(docShareStrategyAuditor.getUserDeptName());
        auditorVO.setAudit_strategy_id(docShareStrategyAuditor.getAuditStrategyId());
        auditorVO.setAudit_sort(docShareStrategyAuditor.getAuditSort());
        return auditorVO;
    }

}
