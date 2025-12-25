package com.aishu.wf.core.engine.core.model;

import lombok.Data;
import org.activiti.engine.history.HistoricProcessInstance;

import java.util.List;
import java.util.Map;

/**
 * @author Liuchu
 * @since 2021-3-20 16:25:23
 */
@Data
public class ProcessInstanceLog {

    private HistoricProcessInstance currentProcessInstance;

    private List<ProcessLogModel> processDetailLogs;

    private List<Map<String, Object>> processTrace;

}
