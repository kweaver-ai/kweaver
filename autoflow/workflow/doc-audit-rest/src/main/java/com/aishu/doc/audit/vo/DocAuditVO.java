package com.aishu.doc.audit.vo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.CommonUtils;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.engine.core.model.ProcessAuditor;
import com.aishu.wf.core.engine.core.model.dto.AuditIdeaConfigDTO;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * @description 申请详情
 * @author ouandyang
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "文档审核对象")
public class DocAuditVO {
    @ApiModelProperty(value = "审核记录id", example = "")
    private String id;

    @ApiModelProperty(value = "文档ID", example = "gns://xxx/xxx")
    private String doc_id;

    @ApiModelProperty(value = "文档路径", example = "AnyShare://xxx/xxx/xxx.txt")
    private String doc_path;

    @ApiModelProperty(value = "文档类型", example = "file")
    private String doc_type;

    @ApiModelProperty(value = "业务ID", example = "99b53b54-8ecd-11eb-8978-080027383fc3")
    private String biz_id;

    @ApiModelProperty(value = "业务类型，realname表示共享给指定用户的申请 anonymous表示共享给任意用户的申请 sync表示同步申请 flow表示流转申请 security表示定密申请",
            example = "realname")
    private String biz_type;

    @ApiModelProperty(value = "业务类型，realname表示共享给指定用户的申请 anonymous表示共享给任意用户的申请 sync表示同步申请 flow表示流转申请 security表示定密申请",
            example = "realname")
    private String apply_type;

    @ApiModelProperty(value = "申请人名称", example = "张三")
    private String apply_user_name;

    @ApiModelProperty(value = "申请人ID", example = "864374c8-483f-11ed-b699-cae781a55823")
    private String apply_user_id;

    @ApiModelProperty(value = "申请时间", example = "2020-01-01 00:00:00")
    private Date apply_time;

    @ApiModelProperty(value = "审核模式，tjsh表示同级审核 hqsh表示会签审核 zjsh表示逐级审核", example = "tjsh")
    private String audit_type;

    @ApiModelProperty(value = "申请明细，accessor_name表示访问者名称 allow_value表示允许权限 deny_value表示拒绝权限 inherit表示禁用继承权限 " +
            "expires_at表示有效期 op_type表示权限操作类型 link_id表示ShareedLink地址link值 title表示链接标题 password表示提取码 access_limit表示打开次数")
    private Object apply_detail;

    @ApiModelProperty(value = "流程实例ID")
    private String proc_inst_id;

    @ApiModelProperty(value = "审核状态，pending表示审核中 pass表示已通过 reject表示已拒绝 avoid表示免审核 cancel表示撤销", example = "end")
    private String audit_status;

    @ApiModelProperty(value = "最后一次审核意见，默认为审核意见，当审核状态为6时代表发起失败异常码，异常码包含：S0001未配置审核策略;S0002无匹配审核员;S0003无匹配的审核员（发起人与审核人为同一人);S0004无匹配密级审核员", example = "同意")
    private String audit_msg;

    @ApiModelProperty(value = "任务ID", example = "2915d310-f2be7785500-74bbd8e8df5")
    private String task_id;
    @ApiModelProperty(value = "源文件名称", example = "2915d310-f2be7785500-74bbd8e8df5")
    private String source_file_names;

    @ApiModelProperty(value = "流程删除者名称")
    private String del_name;

    @ApiModelProperty(value = "是否是当前办件的审核员")
    private boolean applicationAuditor;

    @ApiModelProperty(value = "审核员")
    private List<ProcessAuditorVo> auditors;

    @ApiModelProperty(value = "workflow", example = "workflow")
    private ArbitrailyWorkflowVO workflow;
    
    @ApiModelProperty(value = "customDescription", example = "")
    private Object customDescription;

    @ApiModelProperty(value = "strategy_configs", example = "")
    private Object strategy_configs;

    @ApiModel(value = "审核员对象")
    @Data
    private static class ProcessAuditorVo {
        @ApiModelProperty(value = "审核员ID", example = "99b53b54-8ecd-11eb-8978-080027383fc3")
        private String id;

        @ApiModelProperty(value = "审核员名称", example = "张三")
        private String name;

        @ApiModelProperty(value = "审核员账号", example = "zhangsan")
        private String account;

        @ApiModelProperty(value = "审核员审核状态，pending表示审核中 pass表示同意 reject表示拒绝", example = "pass")
        private String status;

        @ApiModelProperty(value = "审核时间，未审核为空", example = "2020-01-01 00:00:00")
        private Date audit_date;

        @ApiModelProperty(value = "是否加签审核员，y表示是 n表示否", example = "")
        private String countersign;
    }

    /**
     * @description 构建审核详情
     * @author ouandyang
     * @param  docAuditHistoryModel
     * @updateTime 2021/5/24
     */
    public static DocAuditVO builder(DocAuditHistoryModel docAuditHistoryModel, String frontPluginJsonStr, String customDescriptionJsonStr, DocShareStrategy docShareStrategy){
        DocAuditVO vo = new DocAuditVO();
        Map<String, Object> map = Maps.newHashMap();
        BeanUtil.beanToMap(docAuditHistoryModel).forEach((k, v) -> map.put(StrUtil.toUnderlineCase(k), v));
        BeanUtil.copyProperties(map, vo);
        List<DocAuditVO.ProcessAuditorVo> processAuditorsVo = new ArrayList<ProcessAuditorVo>();
        List<ProcessAuditor> list = JSONUtil.toList(JSONUtil.parseArray(docAuditHistoryModel.getAuditor()),
                ProcessAuditor.class);
        for(ProcessAuditor item : list) {
            DocAuditVO.ProcessAuditorVo auditorVo = new DocAuditVO.ProcessAuditorVo();
            Map<String, Object> map2 = Maps.newHashMap();
            BeanUtil.beanToMap(item).forEach((k, v) -> map2.put(StrUtil.toUnderlineCase(k), v));
            BeanUtil.copyProperties(map2, auditorVo);
            processAuditorsVo.add(auditorVo);
        }
        vo.setId(docAuditHistoryModel.getId());
        vo.setApplicationAuditor(docAuditHistoryModel.isApplicationAuditor());
        vo.setDel_name(JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail()).getStr("delName"));
        vo.setAuditors(processAuditorsVo);
        vo.setAudit_status(AuditStatusEnum.getCodeByValue(docAuditHistoryModel.getAuditStatus()));
        if(docAuditHistoryModel.getApplyDetail() != null){
            JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
            if(detail.containsKey("data")){
                detail.set("data", CommonUtils.jsonStrToMap(detail.getStr("data")));
            }
            vo.setApply_detail(CommonUtils.jsonStrToMap(JSONUtil.toJsonStr(detail)));
            vo.setWorkflow(ArbitrailyWorkflowVO.builder(detail, frontPluginJsonStr));
        }
        if(StrUtil.isNotEmpty(customDescriptionJsonStr)) {
        	vo.setCustomDescription(CommonUtils.jsonStrToMap(customDescriptionJsonStr));
        }
        if (docShareStrategy != null) {
            StrategyConfigsDTO strategyConfigs = JSON.parseObject(docShareStrategy.getStrategyConfigs(), StrategyConfigsDTO.class);
            AuditIdeaConfigDTO  auditIdeaConfig = strategyConfigs == null ? null : strategyConfigs.getAuditIdeaConfig();
            JSONObject object = new JSONObject();
            object.set("audit_idea_config", auditIdeaConfig);
            vo.setStrategy_configs(object);
        }
        return vo;
    }

}
