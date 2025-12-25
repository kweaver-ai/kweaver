package com.aishu.wf.core.doc.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.Date;

/**
 * @description 免审核部门实体
 * @author crzep
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="免审核部门实体")
@TableName("t_wf_free_audit")
public class FreeAuditModel {

    @ApiModelProperty(value = "主键ID", hidden = true)
    @TableId(value = "id", type = IdType.ASSIGN_UUID)
    private String id;

    @NotBlank
    @Size(max= 100 ,message= "流程定义key不能超过100位" )
    @ApiModelProperty(value = "流程定义key", required = true)
    @TableField(value = "process_def_key")
    private String processDefkey;

    @NotBlank
    @Size(max= 100 ,message= "部门id不能超过100位" )
    @ApiModelProperty(value = "部门id", required = true)
    @TableField(value = "department_id")
    private String departmentId;

    @NotBlank
    @Size(max= 100 ,message= "部门名不能超过100位" )
    @ApiModelProperty(value = "部门名", required = true)
    @TableField(value = "department_name")
    private String departmentName;

    @NotBlank
    @Size(max= 100 ,message= "创建人id不能超过100位" )
    @ApiModelProperty(value = "创建人id", required = true)
    @TableField(value = "create_user_id")
    private String createUserId;

    @ApiModelProperty(value = "创建时间", hidden = true)
    @TableField(value = "create_time")
    private Date createTime;

}