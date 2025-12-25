package com.aishu.doc.audit.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="校验成功对象")
public class TaskCheckResultVO {

    @ApiModelProperty(value = "true:是 false:否")
    private boolean result;

    @ApiModelProperty(value = "审核状态，pending表示审核中 pass表示已通过 reject表示已拒绝 avoid表示免审核 cancel表示撤销", example = "end")
    private String audit_status;

    @ApiModelProperty(value = "审核员")
    private List<DocAuditApplyListVO.ProcessAuditorVo> auditors;

    public static TaskCheckResultVO builder(boolean result, String audit_status, List<DocAuditApplyListVO.ProcessAuditorVo> auditors) {
        TaskCheckResultVO resultVO = new TaskCheckResultVO();
        resultVO.setResult(result);
        resultVO.setAudit_status(audit_status);
        resultVO.setAuditors(auditors);
        return resultVO;
    }
}
