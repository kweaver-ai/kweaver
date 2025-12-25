package com.aishu.wf.core.doc.model;

import com.aishu.wf.core.engine.identity.model.dto.DeptAuditorRuleDTO;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * @description 文档共享审核策略
 * @author hanj
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_wf_doc_share_strategy")
public class DocShareStrategy implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 策略类型，指定用户审核：named_auditor；部门审核员：dept_auditor；连续多级部门审核：multilevel；excuting_auditor 执行流程时通过webhook动态指定审核员；predefined_auditor 发起审核时通过消息 auditor_ids 指定审核员；
     */
    @TableField("strategy_type")
    private String strategyType;

    /**
     * 流程定义ID
     */
    @TableField("proc_def_id")
    private String procDefId;

    /**
     * 流程定义名称
     */
    @TableField("proc_def_name")
    private String procDefName;

    /**
     * 流程环节ID
     */
    @TableField("act_def_id")
    private String actDefId;

    /**
     * 审核模式，同级审核：tjsh；会签审核：hqsh；依次审核：zjsh；
     */
    @TableField("audit_model")
    private String auditModel;

    /**
     * 流程环节名称
     */
    @TableField("act_def_name")
    private String actDefName;

    /**
     * 文档库ID
     */
    @TableField("doc_id")
    private String docId;

    /**
     * 文档库名称
     */
    @TableField("doc_name")
    private String docName;

    /**
     * 文档库类型，个人文档库：user_doc_lib；部门文档库：department_doc_lib；自定义文档库：custom_doc_lib; 知识库: knowledge_doc_lib
     */
    @TableField("doc_type")
    private String docType;

    /**
     * 规则类型，角色：role
     */
    @TableField("rule_type")
    private String ruleType;

    /**
     * 规则ID
     */
    @TableField("rule_id")
    private String ruleId;

    /**
     * 匹配级别类型，直属部门向上一级：belongUp1；直属部门向上二级：belongUp2；直属部门向上三级：belongUp3；直属部门向上四级：belongUp4；直属部门向上五级：belongUp5；
     * 直属部门向上六级：belongUp6；直属部门向上七级：belongUp7；直属部门向上八级：belongUp8；直属部门向上九级：belongUp9；直属部门向上十级：belongUp10；
     * 最高级部门审核员：highestLevel；最高级部门向下一级：highestDown1；最高级部门向下二级：highestDown2；最高级部门向下三级：highestDown3；最高级部门向下四级：highestDown4；
     * 最高级部门向下五级：highestDown5；最高级部门向下六级：highestDown6；最高级部门向下七级：highestDown7；最高级部门向下八级：highestDown8；最高级部门向下九级：highestDown9；最高级部门向下十级：highestDown10；
     */
    @TableField("level_type")
    private String levelType;

    /**
     * 未匹配到部门审核员类型，自动拒绝：auto_reject；自动通过：auto_pass
     */
    @TableField("no_auditor_type")
    private String noAuditorType;

    /**
     * 同一审核员重复审核类型，只需审核一次：once；每次都需要审核：always
     */
    @TableField("repeat_audit_type")
    private String repeatAuditType;

    /**
     * 审核员为发起人自己时审核类型，自动拒绝：auto_reject；自动通过：auto_pass
     */
    @TableField("own_auditor_type")
    private String ownAuditorType;

    /**
     * 是否允许加签
     */
    @TableField("countersign_switch")
    private String countersignSwitch;

    /**
     * 允许最大加签次数
     */
    @TableField("countersign_count")
    private String countersignCount;

    /**
     * 允许最大加签人数
     */
    @TableField("countersign_auditors")
    private String countersignAuditors;

    /**
     * 是否允许转审
     */
    @TableField("transfer_switch")
    private String transferSwitch;

    /**
     * 允许最大转审次数
     */
    @TableField("transfer_count")
    private String transferCount;

    /**
     * 设置权限配置信息
     */
    @TableField("perm_config")
    private String permConfig;

    /**
     * 高级配置后续新增开关配置
     */
    @TableField("strategy_configs")
    private String strategyConfigs;

    /**
     * 创建人ID
     */
    @TableField("create_user_id")
    private String createUserId;

    /**
     * 创建人名称
     */
    @TableField("create_user_name")
    private String createUserName;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;

    @TableField(exist = false)
    private String auditorNames;

    /**
     * 审核员集合
     */
    @TableField(exist = false)
    private List<DocShareStrategyAuditor> auditorList;

    /**
     * 审核员规则集合
     */
    @TableField(exist = false)
    private List<DeptAuditorRuleDTO> dept_auditor_rule_list;

    /**
     * 审核员规则集合
     */
    @TableField(exist = false)
    private String sendBackSwitch;

}
