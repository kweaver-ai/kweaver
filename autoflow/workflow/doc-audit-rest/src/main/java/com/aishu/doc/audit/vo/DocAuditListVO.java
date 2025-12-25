package com.aishu.doc.audit.vo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.engine.core.model.dto.AuditIdeaConfigDTO;
import com.aishu.wf.core.engine.core.model.dto.StrategyConfigsDTO;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * @description 我的审核对象
 * @author ouandyang
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "我的审核对象")
public class DocAuditListVO {

    @ApiModelProperty(value = "申请ID", example = "d915d310f2be778f550074bbd8e58df5")
    private String id;

    @ApiModelProperty(value = "申请类型", example = "realname")
    private String biz_type;

    @ApiModelProperty(value = "文档ID", example = "gns://xxx/xxx")
    private String doc_id;

    @ApiModelProperty(value = "文档路径", example = "AnyShare://技术研究院/xxx/文本.txt")
    private String doc_path;

    @ApiModelProperty(value = "文档类型，folder表示文件夹 file表示文件", example = "file文件")
    public String doc_type;

    @ApiModelProperty(value = "所属文件库类型 user_doc_lib 个人文档库，department_doc_lib 部门文档库，custom_doc_lib 自定义文档库， knowledge_doc_lib 知识库", example = "user_doc_lib", required = true)
    private String doc_lib_type;

    @ApiModelProperty(value = "发起人", example = "张三")
    private String apply_user_name;

    @ApiModelProperty(value = "发起时间", example = "2020-01-01 00:00:00")
    private Date apply_time;

    @ApiModelProperty(value = "审核状态，pending表示审核中 pass表示已通过 reject表示已拒绝 avoid表示免审核 cancel表示撤销", example = "end")
    private String audit_status;

    @ApiModelProperty(value = "{}", example = "apply_detail")
    private Object apply_detail;

    @ApiModelProperty(value = "workflow", example = "workflow")
    private ArbitrailyWorkflowVO workflow;

    @ApiModelProperty(value = "流程实例ID", example = "12b53b54-8ecd-11eb-8978-080027383fc3")
    public String proc_inst_id;

    @ApiModelProperty(value = "文档流转名称", example = "realname")
    private String doc_names;

    @ApiModelProperty(value = "文件版本", example = "12b53b54-8ecd-11eb-8978-080027383fc3")
    private String version;

    @ApiModelProperty(value = "申请人ID", example = "12b53b54-8ecd-11eb-8978-080027383fc3")
    public String apply_user_id;

    // by siyu.chen 2023/7/25
    @ApiModelProperty(value = "处理时间", example = "2020-01-01 00:00:00")
    public Date end_time;

    @ApiModelProperty(value = "strategy_configs", example = "")
    private Object strategy_configs;

    /**
     * @description 组装我的待办、已办列表数据
     * @author ouandyang
     * @param  docAuditApplyModel
     * @updateTime 2021/5/20
     */
    public static DocAuditListVO builder(DocAuditApplyModel docAuditApplyModel, AuditConfig auditConfig, DocShareStrategy docShareStrategy){
        DocAuditListVO vo = new DocAuditListVO();
        Map<String, Object> map = Maps.newHashMap();
        BeanUtil.beanToMap(docAuditApplyModel).forEach((k, v) -> map.put(StrUtil.toUnderlineCase(k), v));
        BeanUtil.copyProperties(map, vo);
        String frontPluginJsonStr = auditConfig.builderFrontPlugin(docAuditApplyModel.getBizType());
        bulidApplyDetail(docAuditApplyModel.getApplyDetail(), vo,docAuditApplyModel.getBizType(), frontPluginJsonStr);
        if (docShareStrategy != null) {
            StrategyConfigsDTO strategyConfigs = JSON.parseObject(docShareStrategy.getStrategyConfigs(), StrategyConfigsDTO.class);
            AuditIdeaConfigDTO  auditIdeaConfig = strategyConfigs == null ? null : strategyConfigs.getAuditIdeaConfig();
            JSONObject object = new JSONObject();
            object.set("audit_idea_config", auditIdeaConfig);
            vo.setStrategy_configs(object);
        }
        return vo;
    }

    /**
     * @description 组装我的待办、已办列表数据
     * @author ouandyang
     * @param  docAuditHistoryModel
     * @updateTime 2021/5/20
     */
    public static DocAuditListVO builder(DocAuditHistoryModel docAuditHistoryModel, AuditConfig auditConfig){
        DocAuditListVO vo = new DocAuditListVO();
        Map<String, Object> map = Maps.newHashMap();
        BeanUtil.beanToMap(docAuditHistoryModel).forEach((k, v) -> map.put(StrUtil.toUnderlineCase(k), v));
        BeanUtil.copyProperties(map, vo);
        if (docAuditHistoryModel.getAuditStatus() != null) {
            vo.setAudit_status(AuditStatusEnum.getCodeByValue(docAuditHistoryModel.getAuditStatus()));
        }
        // by siyu.chen 2023/7/25
        vo.setEnd_time(docAuditHistoryModel.getLastUpdateTime());
        String frontPluginJsonStr = auditConfig.builderFrontPlugin(docAuditHistoryModel.getBizType());
        bulidApplyDetail(docAuditHistoryModel.getApplyDetail(), vo, docAuditHistoryModel.getBizType(), frontPluginJsonStr);
        return vo;
    }

    private static void bulidApplyDetail(String applyDetail, DocAuditListVO vo, String bizType, String frontPluginJsonStr) {
        JSONObject json = JSONUtil.parseObj(applyDetail);
        if (json.get("docType") != null) {
            vo.setDoc_type(json.getStr("docType"));
        }
        if (json.get("docLibType") != null) {
            vo.setDoc_lib_type(json.getStr("docLibType"));
        }
        if (json.get("applyUserName") != null) {
            vo.setApply_user_name(json.getStr("applyUserName"));
        }
        if (json.get("applyTime") != null) {
             vo.setApply_time(DateUtil.parse(json.getStr("applyTime")));
        }
        if (json.get("applyUserId") != null) {
            vo.setApply_user_id(json.getStr("applyUserId"));
        }
         if(json.get("applyDetail") != null){
            Map<String, Object> obj = JSON.parseObject(json.getStr("applyDetail"), HashMap.class);
            Map<String, Object> detailObj = Maps.newHashMap();
            obj.forEach((k, v) -> detailObj.put(StrUtil.toUnderlineCase(k), v));
            vo.setApply_detail(detailObj);
            JSONObject detail = JSONUtil.parseObj(json.get("applyDetail"));
            vo.setWorkflow(ArbitrailyWorkflowVO.builder(detail, frontPluginJsonStr));
        }
    }
}
