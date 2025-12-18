package com.aishu.wf.api.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;

import com.aishu.wf.api.model.CountersignInfoVO;
import com.aishu.wf.api.model.ProcessTraceLogVO;
import com.aishu.wf.api.model.TransferInfoVO;
import com.aishu.wf.core.doc.model.CountersignInfo;
import com.aishu.wf.core.doc.model.TransferInfo;
import com.aishu.wf.core.doc.service.CountersignInfoService;
import com.aishu.wf.core.doc.service.TransferInfoService;
import com.aishu.wf.core.engine.core.model.ProcessInputModel;
import com.aishu.wf.core.engine.core.model.ProcessInstanceLog;
import com.aishu.wf.core.engine.core.service.ProcessInstanceService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ProcessInstanceLogService {
    @Autowired
    private ProcessInstanceService processInstanceService;
    @Autowired
    private CountersignInfoService countersignInfoService;
    @Autowired
    private TransferInfoService transferInfoService;

    private List<ProcessTraceLogVO> getProcTextLogs(String id, Boolean sendBack) {
        ProcessInstanceLog processInstanceLog = processInstanceService.getProcLogs(id, "text");
        List<CountersignInfo> countersignInfoList = countersignInfoService.list(new LambdaQueryWrapper<CountersignInfo>()
                        .eq(CountersignInfo::getProcInstId, id).orderByDesc(CountersignInfo::getBatch));
        List<TransferInfo> transferInfoList = transferInfoService.list(new LambdaQueryWrapper<TransferInfo>()
                .eq(TransferInfo::getProcInstId, id).orderByDesc(TransferInfo::getBatch));
        return ProcessTraceLogVO.builderProcessTraceLogVO(processInstanceLog, countersignInfoList, transferInfoList, sendBack);
    }

    public List<ProcessTraceLogVO> getProcTextLogs(String id) {
        List<ProcessTraceLogVO> logs = new ArrayList<>();
        ProcessInputModel inputModel = processInstanceService.getProcessInputVariableByFinished(id);
        Map<String, Object> fileds = inputModel.getFields();
        Object sendBack = fileds.containsKey("sendBack");
        Object preProcInstIds = fileds.get("preProcInstIds");
        if (sendBack!=null && (Boolean) sendBack && preProcInstIds!=null){
            List<String> procInstIdList = (List<String>) preProcInstIds;
            procInstIdList.stream().forEach(procId -> {
                logs.addAll(this.getProcTextLogs(procId, true)); 
            });
        }
        logs.addAll(this.getProcTextLogs(id, false)); 
        return logs;
    }
}
