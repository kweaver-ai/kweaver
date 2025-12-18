package com.aishu.wf.core.engine.config.model;

import com.aishu.wf.core.common.model.BasePage;
import com.aishu.wf.core.engine.util.ProcessModelUtils;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.bpmn.model.*;
import org.apache.commons.lang3.StringUtils;

import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * @author lw
 * @version 1.0
 * @since
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@ApiModel(value = "环节配置信息")
@TableName("t_wf_activity_info_config")
public class ActivityInfoConfig implements Serializable {
    private static final long serialVersionUID = 5454155825314635342L;

    public static final String ACTIVITY_DEF_CHILD_TYPE_THROUGH = "through";
    public static final String ACTIVITY_DEF_CHILD_TYPE_INSIDE = "inside";
    /**
     * 环节跳转类型，AUTO：自动路径跳转；MANUAL：人工选择跳转、FREE：自由选择跳转
     */
    private static final String JUMP_TYPE_AUTO = "AUTO";
    private static final String JUMP_TYPE_FREE = "FREE";
    private static final String JUMP_TYPE_MANUAL = "MANUAL";

    // date formats

    // 可以直接使用: @Size(max=50,message="用户名长度不能大于50")显示错误消息
    // columns START
    /**
     * 流程环节定义ID db_column: ACTIVITY_DEF_ID
     */
    @Size(max = 100)
    @TableId(value = "activity_def_id")
    private String activityDefId;
    /**
     * 流程环节定义名称 db_column: ACTIVITY_DEF_NAME
     */
    @Size(max = 100)
    @TableField("activity_def_name")
    private String activityDefName;
    /**
     * 流程环节状态名称(默认与环节名称一致) db_column: ACTIVITY_STATUS_NAME
     */
    @Size(max = 100)
    @TableField("activity_status_name")
    private String activityStatusName;
    /**
     * 流程定义ID db_column: PROCESS_DEF_ID
     */
    @Size(max = 100)
    @TableField(value = "process_def_id")
    private String processDefId;
    /**
     * 流程定义名称 db_column: PROCESS_DEF_NAME
     */
    @Size(max = 100)
    @TableField("process_def_name")
    private String processDefName;
    /**
     * 流程环节表单URL db_column: ACTIVITY_PAGE_URL
     */
    @Size(max = 500)
    @TableField("activity_page_url")
    private String activityPageUrl;
    /**
     * 流程环节表单数据 db_column: ACTIVITY_PAGE_INFO
     */
    @Size(max = 4000)
    @TableField("activity_page_info")
    private String activityPageInfo;
    /**
     * 流程环节绑定操作权限ID,多个权限ID以#号分隔 db_column: ACTIVITY_OPERATION_ROLEID
     */
    @Size(max = 4000)
    @TableField("activity_operation_roleid")
    private String activityOperationRoleid;

    @Size(max = 500)
    @TableField("remark")
    private String remark;
    /**
     * 环节跳转类型，AUTO：自动路径跳转；MANUAL：人工选择跳转、FREE：自由选择跳转
     */
    @TableField("jump_type")
    private String jumpType;

    @TableField(exist = false)
    private boolean autoJumpType;

    @TableField(exist = false)
    private boolean freeJumpType;
    /**
     * 环节排序
     */
    @TableField("activity_order")
    private Integer activityOrder;
    /**
     * 环节时限
     */
    @TableField("activity_limit_time")
    private Integer activityLimitTime;
    /**
     * 是否显示意见输入区域,默认启用ENABLED,否则禁用DISABLE
     */
    @TableField("is_show_idea")
    private String isShowIdea;
    /**
     * 意见分栏
     */
    @TableField("idea_display_area")
    private String ideaDisplayArea;
    /**
     * 环节类型
     */
    @TableField("activity_def_type")
    private String activityDefType;
    /**
     * 环节处理类型，单人\多人
     */
    @TableField("activity_def_deal_type")
    private String activityDefDealType;
    /**
     * 环节子类型，through:流程贯穿,inside:内部流程
     */
    @TableField("activity_def_child_type")
    private String activityDefChildType;
    /**
     * 其它系统处理状态   0 不可处理；1 仅阅读；2可处理
     */
    @TableField("other_sys_deal_status")
    private String otherSysDealStatus;
    /**
     * 是否是开始节点  是为Y  否为N
     */
    @TableField("is_start_usertask")
    private String isStartUserTask;




    @TableField("c_protocl")
    private String cprotocol;

    @TableField("m_url")
    private String murl;

    @TableField("m_protocl")
    private String mprotocol;

    private static Map activityDefTypeMap = new HashMap();

    static {
        activityDefTypeMap.put(BpmnXMLConstants.ELEMENT_TASK, "用户任务");
        activityDefTypeMap.put(BpmnXMLConstants.ELEMENT_TASK_SCRIPT, "脚本任务");
        activityDefTypeMap.put(BpmnXMLConstants.ELEMENT_TASK_SERVICE, "服务任务");
        activityDefTypeMap.put(BpmnXMLConstants.ELEMENT_CALL_ACTIVITY, "调用子流");
    }


    // columns END

    public static ActivityInfoConfig build(FlowElement fowElement, String procDefId,
                                           String procDefName) {
        ActivityInfoConfig actInfoConfig = new ActivityInfoConfig();
        actInfoConfig.setProcessDefId(procDefId);
        actInfoConfig.setProcessDefName(procDefName);
        actInfoConfig.setActivityDefId(fowElement.getId());
        actInfoConfig.setActivityDefName(fowElement.getName());
        if (UserTask.class.isInstance(fowElement)) {
            actInfoConfig.setJumpType("MANUAL");
            actInfoConfig.setActivityDefType(BpmnXMLConstants.ELEMENT_TASK_USER);
        } else if (ScriptTask.class.isInstance(fowElement)) {
            actInfoConfig.setJumpType("AUTO");
            actInfoConfig
                    .setActivityDefType(BpmnXMLConstants.ELEMENT_TASK_SCRIPT);
        } else if (ServiceTask.class.isInstance(fowElement)) {
            actInfoConfig.setJumpType("AUTO");
            actInfoConfig
                    .setActivityDefType(BpmnXMLConstants.ELEMENT_TASK_SERVICE);
        } else if (ExclusiveGateway.class.isInstance(fowElement)) {
            actInfoConfig.setJumpType("AUTO");
            actInfoConfig.setActivityDefType(BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE);
        } else if (CallActivity.class.isInstance(fowElement)) {
            actInfoConfig.setJumpType("AUTO");
            actInfoConfig.setActivityDefType(BpmnXMLConstants.ELEMENT_CALL_ACTIVITY);
        }
        actInfoConfig.setActivityDefDealType(ProcessModelUtils.getActDealType(fowElement));
        actInfoConfig.setIsShowIdea("ENABLED");
        return actInfoConfig;
    }

    public static ActivityInfoConfig buildUpdate(FlowElement fowElement, ActivityInfoConfig actInfoConfig) {
        actInfoConfig.setActivityDefId(fowElement.getId());
        actInfoConfig.setActivityDefName(fowElement.getName());
        actInfoConfig.setActivityDefDealType(ProcessModelUtils.getActDealType(fowElement));
        return actInfoConfig;
    }

    public boolean isMulti() {
        return StringUtils.isEmpty(activityDefDealType) ? false : ("multi"
                .equals(activityDefDealType) || ("multi-x"
                .equals(activityDefDealType)));
    }

    public ActivityInfoConfig() {
    }

    public ActivityInfoConfig(String activityDefId, String processDefId) {
        this.activityDefId = activityDefId;
        this.processDefId = processDefId;
    }
}

