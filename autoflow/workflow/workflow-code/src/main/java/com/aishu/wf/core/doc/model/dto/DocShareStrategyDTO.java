package com.aishu.wf.core.doc.model.dto;

import com.aishu.wf.core.common.exception.BizExceptionCodeEnum;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.util.StringUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleDTO;
import com.baomidou.mybatisplus.annotation.TableField;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@ApiModel(value = "文档共享审核策略参数对象")
@Data
public class DocShareStrategyDTO {

    @ApiModelProperty(value = "主键")
    private String id;

    @ApiModelProperty(value = "策略类型，指定用户审核：named_auditor；部门审核员：dept_auditor；连续多级部门审核：multilevel;动态指定审核员:excuting_auditor；predefined_auditor:预定义审核员", example = "named_auditor", required = true)
    @Pattern(regexp = "named_auditor|dept_auditor|multilevel|excuting_auditor|predefined_auditor", message = "策略类型不正确")
    private String strategy_type;

    @ApiModelProperty(value = "动态指定审核员时的业务标识", example = "af_data_owner_audit")
    @Size(max = 100, message = "策略标识不能超过100")
    private String strategy_tag;

    @ApiModelProperty(value = "流程定义ID", example = "Process_FXZ59TKT:1:7286e791-78a6-11eb-8fc3-0242ac12000f")
    @Size(max = 100,message = "流程定义ID不能超过100")
    private String proc_def_id;

    @ApiModelProperty(value = "流程定义名称", example = "共享审核流程", required = true)
    @Size(max = 100,message = "流程定义名称不能超过100")
    private String proc_def_name;

    @ApiModelProperty(value = "流程环节ID", example = "UserTask_1eit5rd")
    @Size(max = 30,message = "流程环节ID不能超过30")
    private String act_def_id;

    @ApiModelProperty(value = "流程环节名称", example = "审核")
    @Size(max = 100,message = "流程环节名称不能超过100")
    private String act_def_name;

    @ApiModelProperty(value = "审核模式（同级审核：tjsh；会签审核：hqsh；依次审核：zjsh）", example = "tjsh")
    @Size(max = 10,message = "审核模式不能超过10")
    private String audit_model;

    @ApiModelProperty(value = "文档ID（文档共享审核）", example = "gns://922F9FC6E9E64BDFB43B6BEE6D5FA118/6C25B4B673244BA19FD80CBA6202B280")
    @Size(max = 100,message = "文档ID不能超过100")
    private String doc_id;

    @ApiModelProperty(value = "文档类型，共享：se、定密：st（文档共享审核）", example = "se")
    @Size(max = 10,message = "文档类型不能超过10")
    private String doc_type;

    @ApiModelProperty(value = "文档名称（文档共享审核）", example = "测试上传文档123.txt")
    @Size(max = 100,message = "文档名称不能超过100")
    private String doc_name;

    @ApiModelProperty(value = "规则类型，角色：role", example = "role")
    @Pattern(regexp = "role", message = "规则类型不正确")
    private String rule_type;

    @ApiModelProperty(value = "规则ID", example = "")
    private String rule_id;

    @ApiModelProperty(value = "部门审核员规则列表")
    private List<DeptAuditorRuleDTO> dept_auditor_rule_list;


    @ApiModelProperty(value = "匹配级别类型，直属部门向上一级：belongUp1；直属部门向上二级：belongUp2；直属部门向上三级：belongUp3；直属部门向上四级：belongUp4；" +
            "直属部门向上五级：belongUp5；直属部门向上六级：belongUp6；直属部门向上七级：belongUp7；直属部门向上八级：belongUp8；直属部门向上九级：belongUp9；" +
            "直属部门向上十级：belongUp10；最高级部门审核员：highestLevel；最高级部门向下一级：highestDown1；最高级部门向下二级：highestDown2；最高级部门向下三级：highestDown3；" +
            "最高级部门向下四级：highestDown4；最高级部门向下五级：highestDown5；最高级部门向下六级：highestDown6；最高级部门向下七级：highestDown7；最高级部门向下八级：highestDown8；" +
            "最高级部门向下九级：highestDown9；最高级部门向下十级：highestDown10；", example = "belongUp2")
    @Pattern(regexp = "belongUp1|belongUp2|belongUp3|belongUp4|belongUp5|belongUp6|belongUp7|belongUp8|belongUp9|belongUp10" +
            "|highestLevel|highestDown1|highestDown2|highestDown3|highestDown4|highestDown5|highestDown6|highestDown7|highestDown8|highestDown9|highestDown10", message = "策略类型不正确")
    private String level_type;

    @ApiModelProperty(value = "未匹配到部门审核员类型，自动拒绝：auto_reject；自动通过：auto_pass", example = "auto_reject")
    @Pattern(regexp = "auto_reject|auto_pass", message = "未匹配到部门审核员类型不正确")
    private String no_auditor_type;

    @ApiModelProperty(value = "同一审核员重复审核类型，只需审核一次：once；每次都需要审核：always", example = "once")
    @Pattern(regexp = "once|always", message = "同一审核员重复审核类型不正确")
    private String repeat_audit_type;

    @ApiModelProperty(value = "审核员为发起人自己时审核类型，自动拒绝：auto_reject；自动通过：auto_pass", example = "auto_reject")
    @Pattern(regexp = "auto_reject|auto_pass", message = "审核员为发起人自己时审核类型不正确")
    private String own_auditor_type;

    @ApiModelProperty(value = "是否允许加签", example = "")
    private String countersign_switch;

    @ApiModelProperty(value = "允许最大加签次数", example = "")
    private String countersign_count;

    @ApiModelProperty(value = "允许最大加签人数", example = "")
    private String countersign_auditors;

    @ApiModelProperty(value = "是否允许转审", example = "")
    private String transfer_switch;

    @ApiModelProperty(value = "允许最大转审次数", example = "")
    private String transfer_count;

    @ApiModelProperty(value = "是否允许退回", example = "")
    private String sendback_switch; 

    @ApiModelProperty(value = "创建人ID", example = "8fa10a4c-621a-11eb-8f51-080027e6c16c")
    @Size(max = 50,message = "创建人ID不能超过50")
    private String create_user_id;

    @ApiModelProperty(value = "创建人名称", example = "管理员")
    @Size(max = 50,message = "创建人名称不能超过50")
    private String create_user_name;

    @ApiModelProperty(value = "创建时间", example = "2021-03-01 10:22:58")
    private Date create_time;

    @ApiModelProperty(value = "更新时间", example = "2021-03-01 11:54:27")
    private Date update_time;

    @ApiModelProperty(value = "审核人员列表")
    private List<DocShareStrategyAuditorDTO> auditor_list;

    public static DocShareStrategyDTO builder(DocShareStrategy docShareStrategy) {
        DocShareStrategyDTO shareStrategyDTO = new DocShareStrategyDTO();
        shareStrategyDTO.setId(docShareStrategy.getId());
        if (docShareStrategy.getStrategyType() != null && docShareStrategy.getStrategyType().startsWith(WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue())){
            shareStrategyDTO.setStrategy_type(WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue());
            shareStrategyDTO.setStrategy_tag(docShareStrategy.getStrategyType().substring(WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue().length() + 1));
        }else{
            shareStrategyDTO.setStrategy_type(docShareStrategy.getStrategyType());
        } 
        shareStrategyDTO.setProc_def_id(docShareStrategy.getProcDefId());
        shareStrategyDTO.setProc_def_name(docShareStrategy.getProcDefName());
        shareStrategyDTO.setAct_def_id(docShareStrategy.getActDefId());
        shareStrategyDTO.setAct_def_name(docShareStrategy.getActDefName());
        shareStrategyDTO.setAudit_model(docShareStrategy.getAuditModel());
        shareStrategyDTO.setDoc_type(docShareStrategy.getDocType());
        shareStrategyDTO.setDoc_id(docShareStrategy.getDocId());
        shareStrategyDTO.setDoc_name(docShareStrategy.getDocName());
        shareStrategyDTO.setRule_type(docShareStrategy.getRuleType());
        shareStrategyDTO.setRule_id(docShareStrategy.getRuleId());
        shareStrategyDTO.setLevel_type(docShareStrategy.getLevelType());
        shareStrategyDTO.setNo_auditor_type(docShareStrategy.getNoAuditorType());
        shareStrategyDTO.setRepeat_audit_type(docShareStrategy.getRepeatAuditType());
        shareStrategyDTO.setOwn_auditor_type(docShareStrategy.getOwnAuditorType());
        shareStrategyDTO.setCountersign_switch(docShareStrategy.getCountersignSwitch());
        shareStrategyDTO.setCountersign_count(docShareStrategy.getCountersignCount());
        shareStrategyDTO.setCountersign_auditors(docShareStrategy.getCountersignAuditors());
        shareStrategyDTO.setTransfer_switch(docShareStrategy.getTransferSwitch());
        shareStrategyDTO.setTransfer_count(docShareStrategy.getTransferCount());
        shareStrategyDTO.setSendback_switch(docShareStrategy.getSendBackSwitch());
        shareStrategyDTO.setCreate_user_id(docShareStrategy.getCreateUserId());
        shareStrategyDTO.setCreate_user_name(docShareStrategy.getCreateUserName());
        shareStrategyDTO.setCreate_time(docShareStrategy.getCreateTime());
        shareStrategyDTO.setDept_auditor_rule_list(docShareStrategy.getDept_auditor_rule_list());
        List<DocShareStrategyAuditor> auditorList = docShareStrategy.getAuditorList();
        List<DocShareStrategyAuditorDTO> auditorDTOList = new ArrayList<>();
        auditorList.forEach(item -> {
            DocShareStrategyAuditorDTO auditorDTO = DocShareStrategyAuditorDTO.builder(item);
            auditorDTOList.add(auditorDTO);
        });
        shareStrategyDTO.setAuditor_list(auditorDTOList);
        return shareStrategyDTO;
    }

    public static DocShareStrategy builderModel(DocShareStrategyDTO docShareStrategyDTO) {
        DocShareStrategy strategy = new DocShareStrategy();
        strategy.setId(docShareStrategyDTO.getId());
        if (WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue().equals(docShareStrategyDTO.getStrategy_type())){
            if (StringUtils.isEmpty(docShareStrategyDTO.getStrategy_tag())){
                throw new RestException(BizExceptionCodeEnum.A400001000.getCode(),
                                    BizExceptionCodeEnum.A400001000.getMessage());
            }
            strategy.setStrategyType(docShareStrategyDTO.getStrategy_type() + "_" + docShareStrategyDTO.getStrategy_tag());
        }else{
            strategy.setStrategyType(docShareStrategyDTO.getStrategy_type());
        }
        strategy.setProcDefId(docShareStrategyDTO.getProc_def_id());
        strategy.setProcDefName(docShareStrategyDTO.getProc_def_name());
        strategy.setActDefId(docShareStrategyDTO.getAct_def_id());
        strategy.setActDefName(docShareStrategyDTO.getAct_def_name());
        strategy.setAuditModel(docShareStrategyDTO.getAudit_model());
        strategy.setDocType(docShareStrategyDTO.getDoc_type());
        strategy.setDocId(docShareStrategyDTO.getDoc_id());
        strategy.setDocName(docShareStrategyDTO.getDoc_name());
        strategy.setRuleType(docShareStrategyDTO.getRule_type());
        strategy.setRuleId(docShareStrategyDTO.getRule_id());
        strategy.setLevelType(docShareStrategyDTO.getLevel_type());
        strategy.setNoAuditorType(docShareStrategyDTO.getNo_auditor_type());
        strategy.setRepeatAuditType(docShareStrategyDTO.getRepeat_audit_type());
        strategy.setOwnAuditorType(docShareStrategyDTO.getOwn_auditor_type());
        strategy.setCountersignSwitch(docShareStrategyDTO.getCountersign_switch());
        strategy.setCountersignCount(docShareStrategyDTO.getCountersign_count());
        strategy.setCountersignAuditors(docShareStrategyDTO.getCountersign_auditors());
        strategy.setTransferSwitch(docShareStrategyDTO.getTransfer_switch());
        strategy.setTransferCount(docShareStrategyDTO.getTransfer_count());
        strategy.setSendBackSwitch(docShareStrategyDTO.getSendback_switch());
        strategy.setCreateUserId(docShareStrategyDTO.getCreate_user_id());
        strategy.setCreateUserName(docShareStrategyDTO.getCreate_user_name());
        strategy.setCreateTime(docShareStrategyDTO.getCreate_time());
        strategy.setDept_auditor_rule_list(docShareStrategyDTO.getDept_auditor_rule_list());
        List<DocShareStrategyAuditorDTO> auditorDTOList = docShareStrategyDTO.getAuditor_list();
        List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
        auditorDTOList.forEach(item -> {
            DocShareStrategyAuditor auditor = DocShareStrategyAuditorDTO.builderModel(item);
            auditorList.add(auditor);
        });
        strategy.setAuditorList(auditorList);
        return strategy;
    }

}
