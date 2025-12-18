package com.aishu.doc.audit.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.Date;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
public abstract class DocBase {

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 申请ID
     */
    private String applyId;

    /**
     * 文档ID
     */
    private String docId;

    /**
     * 文档名称
     */
    private String docName;

    /**
     * 文档类型 folder文件夹,file文件
     */
    private String docType;

    /**
     * 文件密级,5~15，如果是文件夹，则为0
     */
    private Integer csfLevel;

    /**
     * 申请内容
     */
    private String content;

    /**
     * 流程定义ID
     */
    private String procDefId;

    /**
     * 流程定义名称
     */
    private String procDefName;

    /**
     * 流程实例ID
     */
    private String procInstId;

    /**
     * 审核员
     */
    private String auditor;

    /**
     * 审核状态
     */
    private String status;

    /**
     * 审核结果
     */
    private String result;

    /**
     * 创建人
     */
    private String createUserId;

    /**
     * 创建人名称
     */
    private String createUserName;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 冗余字段-流程结束时间
     */
    @TableField(exist = false)
    private Date procEndTime;

    /**
     * 冗余字段-任务ID
     */
    @TableField(exist = false)
    private String taskId;
}
