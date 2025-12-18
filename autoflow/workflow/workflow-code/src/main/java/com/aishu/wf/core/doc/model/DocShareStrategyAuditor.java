package com.aishu.wf.core.doc.model;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.TableField;
import java.io.Serializable;
import java.util.Date;

import lombok.*;
import lombok.experimental.Accessors;

/**
 * @description 文档共享审核员表
 * @author hanj
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_wf_doc_share_strategy_auditor")
public class DocShareStrategyAuditor implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 审核人
     */
    @TableField("user_id")
    private String userId;

    /**
     * 审核人账号
     */
    @TableField("user_code")
    private String userCode;

    /**
     * 审核人名称
     */
    @TableField("user_name")
    private String userName;

    /**
     * 审核人部门ID
     */
    @TableField("user_dept_id")
    private String userDeptId;

    /**
     * 审核人部门名称
     */
    @TableField("user_dept_name")
    private String userDeptName;

    /**
     * 审核策略ID（t_wf_doc_audit_strategy主键）
     */
    @TableField("audit_strategy_id")
    private String auditStrategyId;

    /**
     * 审核人排序
     */
    @TableField("audit_sort")
    private Integer auditSort;

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

    /**
     * 用户类型
     */
    @TableField("org_type")
    private String orgType;


}
