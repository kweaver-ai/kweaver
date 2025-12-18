package com.aishu.wf.core.engine.config.model;

import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.common.model.BasePage;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author lw
 * @version 1.0
 * @since
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@ApiModel(value = "流程配置信息")
@TableName("t_wf_process_info_config")
public class ProcessInfoConfig implements Serializable {

    private static final long serialVersionUID = 5454155825314635342L;

    @Size(max = 100)
    @ApiModelProperty(value = "流程定义ID", example = "Process_QM57BLUS:5:c1084fd3-7cc9-11eb-8bb9-00ff1601c9e0")
    @TableId(value = "process_def_id")
    private String processDefId;

    @Size(max = 100)
    @ApiModelProperty(value = "流程定义名称", example = "共享审核流程")
    @TableField("process_def_name")
    private String processDefName;

    @Size(max = 100)
    @ApiModelProperty(value = "流程定义KEY", example = "Process_QM57BLUS")
    @TableField("process_def_key")
    private String processDefKey;

    @Size(max = 50)
    @ApiModelProperty(value = "流程类型", example = "doc_share")
    @TableField("process_type_id")
    private String processTypeId;

    @ApiModelProperty(value = "流程类型名称", example = "文档共享审核")
    @TableField("process_type_name")
    private String processTypeName;

    @Size(max = 1000)
    @ApiModelProperty(value = "流程表单URL", example = "processPageUrl")
    @TableField("process_page_url")
    private String processPageUrl;

    @Size(max = 4000)
    @ApiModelProperty(value = "流程表单数据", example = "processPageInfo")
    @TableField("process_page_info")
    private String processPageInfo;

    @Size(max = 500)
    @ApiModelProperty(value = "流程表单起草权限", example = "N")
    @TableField("process_start_auth")
    private String processStartAuth;

    @Size(max = 10)
    @ApiModelProperty(value = "新建流程是否可见", example = "Y")
    @TableField("process_start_isshow")
    private String processStartIsshow;

    @ApiModelProperty(value = "流程版本", example = "1")
    @TableField(exist = false)
    private int processVersion;

    @Size(max = 500)
    @ApiModelProperty(value = "备注", example = "我是备注")
    @TableField("remark")
    private String remark;

    @ApiModelProperty(value = "", example = "")
    @TableField("page_isshow_select_usertree")
    private String pageIshowSelectUserTree;

    @ApiModelProperty(value = "", example = "")
    @TableField("process_handler_class_path")
    private String processHandlerClassPath;

    @ApiModelProperty(value = "排序号", example = "1")
    @TableField("process_start_order")
    private Integer processStartOrder;

    @ApiModelProperty(value = "部署ID", example = "a9ffcaf-8645-11eb-93b1-00ff1169f9ce")
    @TableField("deployment_id")
    private String deploymentId;

    @ApiModelProperty(value = "创建人", example = "admin")
    @TableField("create_user")
    private String createUser;

    @ApiModelProperty(value = "创建人名称", example = "管理员")
    @TableField("create_user_name")
    private String createUserName;

    @ApiModelProperty(value = "创建时间", example = "2021-03-04 10:39:08")
    @TableField("create_time")
    private Date createTime;

    @ApiModelProperty(value = "最后更新时间", example = "2021-03-16 14:28:51")
    @TableField("last_update_time")
    private Date lastUpdateTime;

    @ApiModelProperty(value = "租户ID", example = "workflow")
    @TableField("tenant_id")
    private String tenantId;

    @ApiModelProperty(value = "是否是流程模板", example = "Y")
    @TableField("template")
    private String template;

    @ApiModelProperty(value = "手机端处理状态", example = "")
    @TableField("other_sys_deal_status")
    private String otherSysDealStatus;

    @ApiModelProperty(value = "arisr流程编码", example = "")
    @TableField("aris_code")
    private String arisCode;

    @ApiModelProperty(value = "", example = "")
    @TableField("c_protocl")
    private String cprotocol;

    @ApiModelProperty(value = "", example = "")
    @TableField("m_url")
    private String murl;

    @ApiModelProperty(value = "", example = "")
    @TableField("m_protocl")
    private String mprotocol;

    @ApiModelProperty(value = "", example = "")
    @TableField(exist = false)
    private String modelId;

    @ApiModelProperty(value = "", example = "")
    @TableField(exist = false)
    private String eqProcessDefName;

    @ApiModelProperty(value = "", example = "")
    @TableField(exist = false)
    private String auditor;


    private static Map processStartIsshowMap = new LinkedHashMap();

    @TableField(exist = false)
    private List<ActivityInfoConfig> activityInfoConfigs;

    @TableField(exist = false)
    private List<ActivityRule> activityRules;

    @TableField(exist = false)
    private Integer filterInvalid = 0;

    @TableField(exist = false)
    private Integer filterShare = 0;

    /**
     * 流程定义管理状态
     */
    private String processMgrState;
    private static Map processMgrStateMap = new LinkedHashMap();
    public static final String PROCESS_START_ISSHOW_YES = "Y";
    public static final String PROCESS_START_ISSHOW_NO = "Y";
    public static final String PROCESS_MGR_STATE_UNRELEASE = "UNRELEASE";
    public static final String PROCESS_MGR_STATE_UPDATE = "UPDATE";
    public static final String PROCESS_MGR_STATE_RELEASE = "RELEASE";
    /**
     * 流程定义与模型同步状态，Y:已同步,N:未同步
     */
    private String processModelSyncState;
    public static String PROCESS_MODEL_SYNC_STATE_Y = "Y";
    public static String PROCESS_MODEL_SYNC_STATE_N = "N";
    /**
     * 流程定义管理状态：Y:可见，N:不可见'
     */
    private String processMgrIsshow;

    public static final String PROCESS_MGR_ISSHOW_Y = "Y";
    public static final String PROCESS_MGR_ISSHOW_N = "N";
    
    static {
        processStartIsshowMap.put(PROCESS_MGR_ISSHOW_Y, "可见");
        processStartIsshowMap.put(PROCESS_MGR_ISSHOW_N, "不可见");
        processMgrStateMap.put(PROCESS_MGR_STATE_UNRELEASE, "未发布");
        processMgrStateMap.put(PROCESS_MGR_STATE_UPDATE, "修订中");
        processMgrStateMap.put(PROCESS_MGR_STATE_RELEASE, "已发布");
    }

    public static ProcessInfoConfig build(ProcessDefinitionModel processDefinition) {
        ProcessInfoConfig processInfoConfig = new ProcessInfoConfig();
        processInfoConfig.processDefId = processDefinition.getProcDefId();
        processInfoConfig.processDefKey = processDefinition.getProcDefKey();
        processInfoConfig.processDefName = processDefinition.getProcDefName();
        processInfoConfig.deploymentId = processDefinition.getDeploymentId();
        processInfoConfig.processVersion = processDefinition.getVersion();
        processInfoConfig.tenantId = processDefinition.getTenantId();
        processInfoConfig.processTypeId = processDefinition.getCategory();
        processInfoConfig.remark = processDefinition.getDescription();
        Date nowDate = new Date();
        processInfoConfig.createTime = nowDate;
        processInfoConfig.lastUpdateTime = nowDate;
        processInfoConfig.processStartIsshow = PROCESS_MGR_ISSHOW_Y;
        processInfoConfig.processMgrState = PROCESS_MGR_STATE_UNRELEASE;
        processInfoConfig.setOtherSysDealStatus("yes");
        processInfoConfig.setCprotocol("hnzy:workitem");
        processInfoConfig.setMprotocol("none");
        return processInfoConfig;
    }


    public ProcessInfoConfig() {
    }

    public ProcessInfoConfig(String processDefId) {
        this.processDefId = processDefId;
    }

    public boolean isRelease() {
        return PROCESS_MGR_STATE_RELEASE.equals(this.processMgrState);
    }

    public boolean isUpdate() {
        return PROCESS_MGR_STATE_UPDATE.equals(this.processMgrState);
    }


    public String toString() {
        return ToStringBuilder.reflectionToString(this, ToStringStyle.MULTI_LINE_STYLE);
    }


    public int hashCode() {
        return new HashCodeBuilder()
                .append(getProcessDefId())
                .toHashCode();
    }

    public boolean equals(Object obj) {
        if (obj instanceof ProcessInfoConfig == false) {
            return false;
        }
        if (this == obj) {
            return true;
        }
        ProcessInfoConfig other = (ProcessInfoConfig) obj;
        return new EqualsBuilder()
                .append(getProcessDefId(), other.getProcessDefId())
                .isEquals();
    }




}

