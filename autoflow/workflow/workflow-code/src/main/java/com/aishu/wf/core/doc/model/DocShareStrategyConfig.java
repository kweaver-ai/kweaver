package com.aishu.wf.core.doc.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;
import lombok.experimental.Accessors;

import java.io.Serializable;

/**
 * @description 文档共享审核策略配置
 * @author hanj
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_wf_doc_share_strategy_config")
public class DocShareStrategyConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 流程定义ID
     */
    @TableField("f_proc_def_id")
    private String procDefId;

    /**
     * 流程定义ID
     */
    @TableField("f_act_def_id")
    private String actDefId;

    /**
     * 流程环节ID
     */
    @TableField("f_name")
    private String name;

    /**
     * 流程环节ID
     */
    @TableField("f_value")
    private String value;  

}
