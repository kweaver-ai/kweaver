package com.aishu.doc.audit.vo;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.common.CommonUtils;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/11/18 11:04
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="任意审核消息实体workflow对象VO")
public class ArbitrailyWorkflowVO {

    @NotBlank(message = "apply_id不能为空")
    @ApiModelProperty(value = "审核内容和申请人的最高密级", example = "5")
    private Integer top_csf;

    @NotBlank(message = "审核邮件需要展示的key及顺序")
    @ApiModelProperty(value = "申请人名称", example = "[\"target\",\"source\"]")
    private List<String> msg_for_email;

    @NotBlank(message = "审核日志需要展示的key及顺序")
    @ApiModelProperty(value = "audit_type",example = "[\"source\",\"target\",\"mode\"]")
    private List<String> msg_for_log;

    @ApiModelProperty(value = "通知内容（包括摘要，邮件，审核详情，审核消息需要展示的内容）")
    private Object content;

    @ApiModelProperty(value = "摘要信息")
    private Object abstract_info;

    @ApiModelProperty(value = "前端详情插件信息")
    private Object front_plugin_info;

    public static ArbitrailyWorkflowVO builder(JSONObject applyDetail, String frontPluginJsonStr){
        if(!applyDetail.containsKey("workflow")){
            return null;
        }
        JSONObject workflowObject = JSONUtil.parseObj(applyDetail.getStr("workflow"));
        ArbitrailyWorkflowVO arbitrailyWorkflowVO = JSONUtil.toBean(workflowObject, ArbitrailyWorkflowVO.class);
        arbitrailyWorkflowVO.setContent(CommonUtils.jsonToMap(workflowObject,"content"));
        arbitrailyWorkflowVO.setAbstract_info(CommonUtils.jsonToMap(workflowObject,"abstract_info"));
        arbitrailyWorkflowVO.setFront_plugin_info(CommonUtils.jsonStrToMap(frontPluginJsonStr));
        return arbitrailyWorkflowVO;
    }
}
