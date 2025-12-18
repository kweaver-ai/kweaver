package com.aishu.wf.api.model;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2021/6/29 11:46
 */
@Data
@ApiModel(value = "审核策略对象")
public class DocShareStrategyVO {

    @ApiModelProperty(value = "主键")
    private String id;

    @ApiModelProperty(value = "策略类型，指定用户审核：named_auditor；部门审核员：dept_auditor；连续多级部门审核：multilevel", example = "named_auditor")
    private String strategy_type;

    @ApiModelProperty(value = "流程定义ID", example = "Process_FXZ59TKT:1:7286e791-78a6-11eb-8fc3-0242ac12000f")
    private String proc_def_id;

    @ApiModelProperty(value = "流程定义名称", example = "共享审核流程")
    private String proc_def_name;

    @ApiModelProperty(value = "流程环节ID", example = "UserTask_1eit5rd")
    private String act_def_id;

    @ApiModelProperty(value = "流程环节名称", example = "审核")
    private String act_def_name;

    @ApiModelProperty(value = "审核模式", example = "同级审核：tjsh；会签审核：hqsh；依次审核：zjsh")
    private String audit_model;

    @ApiModelProperty(value = "文档ID", example = "gns://922F9FC6E9E64BDFB43B6BEE6D5FA118/6C25B4B673244BA19FD80CBA6202B280")
    private String doc_id;

    @ApiModelProperty(value = "文档类型，共享：se、定密：st", example = "se")
    private String doc_type;

    @ApiModelProperty(value = "文档名称", example = "测试上传文档123.txt")
    private String doc_name;

    @ApiModelProperty(value = "规则类型，角色：role", example = "role")
    private String rule_type;

    @ApiModelProperty(value = "规则ID", example = "")
    private String rule_id;

    @ApiModelProperty(value = "匹配级别类型，直属部门向上一级：belongUp1；直属部门向上二级：belongUp2；直属部门向上三级：belongUp3；直属部门向上四级：belongUp4；" +
            "直属部门向上五级：belongUp5；直属部门向上六级：belongUp6；直属部门向上七级：belongUp7；直属部门向上八级：belongUp8；直属部门向上九级：belongUp9；" +
            "直属部门向上十级：belongUp10；最高级部门审核员：highestLevel；最高级部门向下一级：highestDown1；最高级部门向下二级：highestDown2；" +
            "最高级部门向下三级：highestDown3；最高级部门向下四级：highestDown4；最高级部门向下五级：highestDown5；最高级部门向下六级：highestDown6；" +
            "最高级部门向下七级：highestDown7；最高级部门向下八级：highestDown8；最高级部门向下九级：highestDown9；最高级部门向下十级：highestDown10；", example = "belongUp3")
    private String level_type;

    @ApiModelProperty(value = "未匹配到部门审核员类型，自动拒绝：auto_reject；自动通过：auto_pass", example = "auto_reject")
    private String no_auditor_type;

    @ApiModelProperty(value = "审核员为发起人自己时审核类型，自动拒绝：auto_reject；自动通过：auto_pass", example = "auto_reject")
    private String own_auditor_type;

    @ApiModelProperty(value = "是否允许加签", example = "")
    private String countersign_switch;

    @ApiModelProperty(value = "允许最大加签次数", example = "")
    private String countersign_count;

    @ApiModelProperty(value = "允许最大加签人数", example = "")
    private String countersign_auditors;

    @ApiModelProperty(value = "创建人ID", example = "8fa10a4c-621a-11eb-8f51-080027e6c16c")
    private String create_user_id;

    @ApiModelProperty(value = "创建人名称", example = "管理员")
    private String create_user_name;

    @ApiModelProperty(value = "创建时间", example = "2021-03-01 10:22:58")
    private Date create_time;

    @ApiModelProperty(value = "更新时间", example = "2021-03-01 11:54:27")
    private Date update_time;

    @ApiModelProperty(value = "审核人员名称")
    private String auditorNames;

    @ApiModelProperty(value = "审核人员列表")
    private List<DocShareStrategyAuditorVO> auditor_list;

    @ApiModelProperty(value = "是否允许转审", example = "")
    private String transfer_switch;

    @ApiModelProperty(value = "允许最大转审次数", example = "")
    private String transfer_count;

    public static DocShareStrategyVO builder(DocShareStrategy docShareStrategy) {
        DocShareStrategyVO shareStrategyVO = new DocShareStrategyVO();
        shareStrategyVO.setId(docShareStrategy.getId());
        shareStrategyVO.setStrategy_type(docShareStrategy.getStrategyType());
        shareStrategyVO.setProc_def_id(docShareStrategy.getProcDefId());
        shareStrategyVO.setProc_def_name(docShareStrategy.getProcDefName());
        shareStrategyVO.setAct_def_id(docShareStrategy.getActDefId());
        shareStrategyVO.setAct_def_name(docShareStrategy.getActDefName());
        shareStrategyVO.setAudit_model(docShareStrategy.getAuditModel());
        shareStrategyVO.setDoc_type(docShareStrategy.getDocType());
        shareStrategyVO.setDoc_id(docShareStrategy.getDocId());
        shareStrategyVO.setDoc_name(docShareStrategy.getDocName());
        shareStrategyVO.setRule_type(docShareStrategy.getRuleType());
        shareStrategyVO.setRule_id(docShareStrategy.getRuleId());
        shareStrategyVO.setLevel_type(docShareStrategy.getLevelType());
        shareStrategyVO.setNo_auditor_type(docShareStrategy.getNoAuditorType());
        shareStrategyVO.setOwn_auditor_type(docShareStrategy.getOwnAuditorType());
        shareStrategyVO.setCountersign_switch(docShareStrategy.getCountersignSwitch());
        shareStrategyVO.setCountersign_count(docShareStrategy.getCountersignCount());
        shareStrategyVO.setCountersign_auditors(docShareStrategy.getCountersignAuditors());
        shareStrategyVO.setCreate_user_id(docShareStrategy.getCreateUserId());
        shareStrategyVO.setCreate_user_name(docShareStrategy.getCreateUserName());
        shareStrategyVO.setCreate_time(docShareStrategy.getCreateTime());
        shareStrategyVO.setAuditorNames(docShareStrategy.getAuditorNames());
        shareStrategyVO.setTransfer_switch(docShareStrategy.getTransferSwitch());
        shareStrategyVO.setTransfer_count(docShareStrategy.getTransferCount());

        List<DocShareStrategyAuditor> auditorList = docShareStrategy.getAuditorList();
        List<DocShareStrategyAuditorVO> auditorVOList = new ArrayList<>();
        if(null != auditorList){
            auditorList.forEach(item -> {
                DocShareStrategyAuditorVO auditorVO = DocShareStrategyAuditorVO.builder(item);
                auditorVOList.add(auditorVO);
            });
        }
        shareStrategyVO.setAuditor_list(auditorVOList);
        return shareStrategyVO;
    }
}
