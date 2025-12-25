package com.aishu.wf.api.model;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.TransferInfo;
import com.aishu.wf.core.engine.core.model.ProcessInstanceLog;
import com.aishu.wf.core.engine.core.model.ProcessLogModel;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.activiti.engine.impl.persistence.entity.SuspensionState;

import java.util.*;
import java.util.stream.Collectors;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "流程日志对象")
public class ProcessTraceLogVO {
    /**
     * 审核中
     */
    private final static String ACT_STATUS_PENDING = "1";
    /**
     * 审核完成
     */
    private final static String ACT_STATUS_END = "2";

    @ApiModelProperty(value = "环节ID", example = "")
    private String act_def_key;

    @ApiModelProperty(value = "环节名称", example = "审核")
    private String act_def_name;

    @ApiModelProperty(value = "环节状态，1表示运行中 2表示已执行", example = "1")
    private String act_status;

    @ApiModelProperty(value = "审核模式，同级审核：tjsh；会签审核：hqsh；依次审核：zjsh；", example = "tjsh")
    private String act_model;

    @ApiModelProperty(value = "环节类型，startEvent表示开始节点 userTask表示审核任务", example = "userTask")
    private String act_type;

    @ApiModelProperty(value = "审核员日志对象列表", example = "")
    private List<List<AuditorLogVO>> auditor_logs;

    @ApiModelProperty(value = "加签日志对象列表", example = "")
    private List<CountersignInfoVO> countersign_logs;

    @ApiModelProperty(value = "转审日志对象列表", example = "")
    private List<TransferInfoVO> transfer_logs;

    @ApiModelProperty(value = "审核退回开关", example = "")
    private Boolean send_back;

    /**
     * @description 构建流程日志VO对象
     * @author ouandyang
     * @param  processInstanceLog
     * @updateTime 2021/5/13
     */
    public static List<ProcessTraceLogVO> builderProcessTraceLogVO(ProcessInstanceLog processInstanceLog, List<CountersignInfo> countersignInfoList, List<TransferInfo> transferInfoList, Boolean sendBack) {
        List<ProcessTraceLogVO> result = new ArrayList<ProcessTraceLogVO>();
        List<ProcessLogModel> processDetailLogs = processInstanceLog.getProcessDetailLogs();
        if (CollUtil.isNotEmpty(processDetailLogs)) { // 开始环节自动拒绝无流程日志
            processDetailLogs.sort(Comparator.comparing(ProcessLogModel::getStartTime));
            processDetailLogs = processDetailLogs.stream().filter(e -> !(null != e.getDeleteReason() && e.getDeleteReason()
                    .equals(WorkFlowContants.ACTION_TYPE_DELETE_MULTIINSTANCE_ACTIVITY + "_" + DocConstants.USER_DELETED))).collect(Collectors.toList());
            List<String> actDefKeySet = processDetailLogs.stream().map(ProcessLogModel::getActDefKey)
                    .collect(Collectors.toList()).stream().distinct().collect(Collectors.toList());
            for(String actDefKey : actDefKeySet) {
                if(actDefKey.equals("EndEvent_1wqgipp")){
                    continue;
                }
                List<ProcessLogModel> temps = processDetailLogs.stream().filter(t -> t.getActDefKey().equals(actDefKey))
                        .collect(Collectors.toList());
                boolean isMultilevel = temps.stream().filter(p -> StrUtil.isNotEmpty(p.getMultilevel())
                        && p.getMultilevel().equals("Y")).findAny().isPresent();
                List<List<AuditorLogVO>> auditor_logs = new ArrayList<>();
                if(isMultilevel) {
                    Map<String, List<ProcessLogModel>> multilevelLogMap = temps.stream().
                            collect(Collectors.groupingBy(ProcessLogModel::getPreTaskId, LinkedHashMap::new, Collectors.toList()));
                    for (String key : multilevelLogMap.keySet()) {
                        List<ProcessLogModel> multilevelLogTemps = multilevelLogMap.get(key);
                        List<AuditorLogVO> auditorLogVOList = multilevelLogTemps.stream()
                                .sorted(Comparator.comparing(ProcessLogModel::getStartTime))
                                .map(AuditorLogVO::buildAuditorLogVO).collect(Collectors.toList());
                        auditor_logs.add(auditorLogVOList);
                    }
                } else {
                    auditor_logs.add(temps.stream().map(AuditorLogVO::buildAuditorLogVO).collect(Collectors.toList()));
                }
                long pendingNum = temps.stream().filter(item -> ACT_STATUS_PENDING.equals(item.getFinishState())).count();
                ProcessTraceLogVO vo = ProcessTraceLogVO.builder()
                        .act_def_key(temps.get(0).getActDefKey())
                        .act_def_name(temps.get(0).getActDefName())
                        .act_status(pendingNum > 0 ? ACT_STATUS_PENDING : ACT_STATUS_END)
                        .act_model(temps.get(0).getActDefModel())
                        .send_back(sendBack)
                        .build();
                if (temps.size() == 1 && "autoPass".equals(temps.get(0).getDeleteReason())) {
                    vo.setAct_type("autoPass");
                    vo.setAuditor_logs(new ArrayList<>());
                } else {
                    vo.setAct_type(temps.get(0).getActDefType());
                    vo.setAuditor_logs(auditor_logs);
                }
                List<CountersignInfo> filterCountersignInfoList = countersignInfoList.stream().filter(c ->
                        c.getTaskDefKey().equals(actDefKey)).collect(Collectors.toList());
                vo.setCountersign_logs(filterCountersignInfoList.stream().map(fci ->
                        CountersignInfoVO.buildCountersignInfoVO(fci)).collect(Collectors.toList()));
                vo = countersignBuilder(vo);
                List<TransferInfo> filterTransferInfoList = transferInfoList.stream().filter(c ->
                        c.getTaskDefKey().equals(actDefKey)).collect(Collectors.toList());
                vo.setTransfer_logs(filterTransferInfoList.stream().map(fci ->
                        TransferInfoVO.buildTransferInfoVO(fci)).collect(Collectors.toList()));
                result.add(vo);
            }
        }
        // 自动拒绝增加审核日志
        if (processInstanceLog.getCurrentProcessInstance().getProcState() == SuspensionState.AUTO_REJECT.getStateCode()) {
            List<List<AuditorLogVO>> auditor_logs = new ArrayList<>();
            ProcessTraceLogVO vo = ProcessTraceLogVO.builder()
                    .act_def_key("sid-start-node")
                    .act_def_name("审核")
                    .act_status(ACT_STATUS_END)
                    .act_type("autoReject")
                    .act_model("tjsh")
                    .auditor_logs(auditor_logs)
                    .build();
            result.add(vo);
        }
        return result;
    }

    private static ProcessTraceLogVO countersignBuilder(ProcessTraceLogVO vo){
        for(List<AuditorLogVO> subAuditorLogs : vo.auditor_logs){
            for(AuditorLogVO subAuditor : subAuditorLogs){
                boolean isCountersignExist = vo.countersign_logs.stream().filter(ci -> ci.getCountersign_auditor().equals(subAuditor.getAuditor())).findAny().isPresent();
                if(isCountersignExist){
                    List<CountersignInfoVO> countersignInfoVOList = vo.countersign_logs.stream().filter(ci -> ci.getCountersign_auditor().equals(subAuditor.getAuditor())).collect(Collectors.toList());
                    boolean countersignTask = subAuditorLogs.stream().filter(sa -> sa.getAct_inst_id().equals(countersignInfoVOList.get(0).getTask_id())).findAny().isPresent();
                    if(countersignTask){
                        subAuditor.setCountersign("y");
                    }
                }
            }
        }
        return vo;
    }
}
