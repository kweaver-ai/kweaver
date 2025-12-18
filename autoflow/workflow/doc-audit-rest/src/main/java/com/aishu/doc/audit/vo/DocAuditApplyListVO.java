package com.aishu.doc.audit.vo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.common.AuditStatusEnum;
import com.aishu.doc.common.CommonUtils;
import com.aishu.wf.core.config.AuditConfig;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.engine.core.model.ProcessAuditor;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

/**
 * @description 我的申请对象
 * @author ouandyang
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "我的申请对象")
public class DocAuditApplyListVO {

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

    @ApiModelProperty(value = "所属文件库类型 user_doc_lib 个人文档库，department_doc_lib 部门文档库，custom_doc_lib 自定义文档库，knowledge_doc_lib 知识库", example = "user_doc_lib", required = true)
    private String doc_lib_type;

    @ApiModelProperty(value = "流程实例ID", example = "12b53b54-8ecd-11eb-8978-080027383fc3")
    public String proc_inst_id;

    @ApiModelProperty(value = "审核员")
    private List<ProcessAuditorVo> auditors;

    @ApiModelProperty(value = "发起时间", example = "2020-01-01 00:00:00")
    private Date apply_time;

    @ApiModelProperty(value = "审核状态，pending表示审核中 pass表示已通过 reject表示已拒绝 avoid表示免审核 cancel表示撤销", example = "end")
    private String audit_status;

    @ApiModelProperty(value = "文档流转名称", example = "realname")
    private String doc_names;

    @ApiModelProperty(value = "{}", example = "apply_detail")
    private Object apply_detail;

    @ApiModelProperty(value = "workflow", example = "workflow")
    private ArbitrailyWorkflowVO workflow;

    @ApiModelProperty(value = "文件版本", example = "99b53b54-8ecd-11eb-8978-080027383fc3")
    private String version;

    @ApiModel(value = "审核员对象")
    @Data
    public static class ProcessAuditorVo {
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
    }

    /**
     * @description 文档审核历史实体转vo
     * @author ouandyang
     * @param  docAuditHistoryModel
     * @updateTime 2021/5/20
     */
    public static DocAuditApplyListVO builder(DocAuditHistoryModel docAuditHistoryModel, AuditConfig auditConfig){
        DocAuditApplyListVO vo = new DocAuditApplyListVO();
        Map<String, Object> map = Maps.newHashMap();
        BeanUtil.beanToMap(docAuditHistoryModel).forEach((k, v) -> map.put(StrUtil.toUnderlineCase(k), v));
        BeanUtil.copyProperties(map, vo);
        vo.setAudit_status(AuditStatusEnum.getCodeByValue(docAuditHistoryModel.getAuditStatus()));
        JSONObject json = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        if(DocConstants.DOC_TYPE_FILE.equals(docAuditHistoryModel.getDocType()) && docAuditHistoryModel.getBizType().equals(DocConstants.BIZ_TYPE_FLOW) && json.containsKey("docList")){
            JSONArray docList = JSON.parseArray(json.get("docList").toString());
            if(docList.size() > 0){
                vo.setVersion(JSONUtil.parseObj(docList.get(0)).get("version").toString());
            }
        }
        if (json.get("docLibType") != null) {
            vo.setDoc_lib_type(json.getStr("docLibType"));
        }

        List<ProcessAuditorVo> processAuditorsVoList = buildProcessAuditorVoList(docAuditHistoryModel.getAuditor());
        JSONObject detail = JSONUtil.parseObj(docAuditHistoryModel.getApplyDetail());
        detail.set("content", CommonUtils.jsonToMap(JSONUtil.parseObj(detail.getStr("workflow")),"content"));

        String frontPluginJsonStr = auditConfig.builderFrontPlugin(docAuditHistoryModel.getApplyType());
        vo.setWorkflow(ArbitrailyWorkflowVO.builder(detail, frontPluginJsonStr));

        Map<String, Object> obj = JSON.parseObject(docAuditHistoryModel.getApplyDetail(), HashMap.class);
        Map<String, Object> detailObj = Maps.newHashMap();
        obj.forEach((k, v) -> detailObj.put(StrUtil.toUnderlineCase(k), v));
        vo.setApply_detail(detailObj);
        vo.setAuditors(processAuditorsVoList);
        return vo;
    }

    public static List<ProcessAuditorVo> buildProcessAuditorVoList(String auditor){
        List<ProcessAuditorVo> processAuditorsVoList = new ArrayList<ProcessAuditorVo>();
        List<ProcessAuditor> list = JSONUtil.toList(JSONUtil.parseArray(auditor),
                ProcessAuditor.class);
        for(ProcessAuditor item : list) {
            ProcessAuditorVo auditorVo = new ProcessAuditorVo();
            Map<String, Object> map2 = Maps.newHashMap();
            BeanUtil.beanToMap(item).forEach((k, v) -> map2.put(StrUtil.toUnderlineCase(k), v));
            BeanUtil.copyProperties(map2, auditorVo);
            processAuditorsVoList.add(auditorVo);
        }

        return processAuditorsVoList;
    }
}
