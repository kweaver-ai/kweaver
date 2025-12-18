package com.aishu.doc.msg.model;

import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModelProperty;
import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.Map;

/**
 * 流程消息内容对象
 *
 * @author liuchu
 * @since 2021-4-21 10:35:07
 */
@Data
@Builder
public class NsqMsgContent {
    /**
     * 访问者名称
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String accessorname;
    /**
     * 访问者类型
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String accessortype;
    /**
     * 审核消息
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String auditmsg;
    /**
     * 审核人名称
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String auditname;
    /**
     * 审核结果
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean auditresult;
    /**
     * 允许权限值
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer allowvalue;
    /**
     * 密级
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer csf;
    /**
     * 禁止权限值
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer denyvalue;
    /**
     * 发起人id
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String id;
    /**
     * 申请id
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String applyid;
    /**
     * 权限值
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer perm;
    /**
     * 截止时间
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long end;
    /**
     * 文档gnsID
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String gns;
    /**
     * 是否继承
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean inherit;
    /**
     * 是否为目录
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean isdir;
    /**
     * 申请人ID
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String sender;
    /**
     * 申请人名称
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String senderName;
    /**
     * 审核任务创建时间
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long time;
    /**
     * 消息类型
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer type;
    /**
     * 文档路径名称
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String url;



    /**
     * 流程创建时间
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private  Date create_time;

    /**
     * 流程完成时间
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private  Date finish_time;

    /**
     * 流程定义名称
     * */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String proc_def_name;

    /**
     * 流程标题
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String wf_proc_title;
    /**
     * 下一个环节定义Name
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String wf_next_act_def_name;
    /**
     * 当前环节意见
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String wf_cur_comment;
    /**
     * 当前环节实例Name
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String wf_cur_act_inst_name;



    /**
     * 基本消息标题
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String title;
    /**
     * 消息界面跳转体制（暂时定义一个死的地址）
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String msglink;


    /**
     * @description 封装NSQ消息体
     * @author xiashenghui
     * @param nsqMsgContent 原生内容
     * @param instanceModel 流程实例对象
     * @updateTime 2022/4/11
     */
    public NsqMsgContent builder(NsqMsgContent nsqMsgContent, ProcessInstanceModel instanceModel){
        ProcessInputModel processInputModel = instanceModel.getProcessInputModel();
        nsqMsgContent.setCreate_time(instanceModel.getCreateTime());
        nsqMsgContent.setFinish_time(instanceModel.getFinishTime());
        nsqMsgContent.setProc_def_name(instanceModel.getProcDefName());
        nsqMsgContent.setWf_proc_title(processInputModel.getWf_procTitle());
        nsqMsgContent.setWf_next_act_def_name(processInputModel.getWf_nextActDefName());
        nsqMsgContent.setWf_cur_comment(processInputModel.getWf_curComment());
        nsqMsgContent.setWf_cur_act_inst_name(processInputModel.getWf_curActInstName());
        nsqMsgContent.setMsglink("http://192.168.136.173:80/deeplinking?messagetype=1&messageid=35bc3c9f-b24c-11ec-9149-00ff5293e62e");
        Map<String, Object> fields = processInputModel.getFields();
        nsqMsgContent.setTitle(getTitle(nsqMsgContent,fields));
        return nsqMsgContent;
    }
    /**
     * @description 获取基本消息标题
     * @author xiashenghui
     * @param fields  申请信息
     * @updateTime 2022/4/11
     */
    public String getTitle(NsqMsgContent nsqMsgContent,Map<String, Object> fields){
       return  nsqMsgContent.getSender()+"给您共享了一个文件："+fields.get("docShortName");
    }

}
