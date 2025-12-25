package com.aishu.wf.core.doc.strategy.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.strategy.AuditorStrategy;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AuditorStrategyContext {

    private Map<String, AuditorStrategy> strategyMap;
    private final String DOC_CONFPERM_AUDIT = WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue() + "_" + WorkflowConstants.DOC_CONFPERM_AUDIT;
    private final String DOC_INHCONFPERM_AUDIT = WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue() + "_" + WorkflowConstants.DOC_INHCONFPERM_AUDIT;
    private final String BELONGDIR_INHCONFPERM_AUDIT = WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue() + "_" + WorkflowConstants.BELONGDIR_INHCONFPERM_AUDIT;

    @Autowired
    public AuditorStrategyContext(NamedAuditorStrategyImpl namedAuditorStrategy,
                                  DeptAuditorStrategyImpl deptAuditorStrategy,
                                  MultilevelAuditorStrategyImpl multilevelAuditorStrategy,
                                  PermApplyAuditorStrategyImpl permApplyAuditorStrategy,
                                  ExecutingAuditorStrategyImpl executingAuditorStrategy,
                                  ManagerAuditorStrategyImpl managerAuditorStrategy,
                                  KcAdminAuditorStrategyImpl kcAdminAuditorStrategy,
                                  PreDefinedAuditorStrategyImpl preDefinedAuditorStrategy) {
        strategyMap = new HashMap<>();
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue(), namedAuditorStrategy);
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue(), deptAuditorStrategy);
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.MULTILEVEL.getValue(), multilevelAuditorStrategy);
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.PREDEFINED_AUDITOR.getValue(), preDefinedAuditorStrategy);
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.EXCUTING_AUDITOR.getValue(), executingAuditorStrategy);
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.MANAGER.getValue(), managerAuditorStrategy);
        strategyMap.put(WorkflowConstants.STRATEGY_TYPE.KC_ADMIN.getValue(), kcAdminAuditorStrategy);
        strategyMap.put(DOC_CONFPERM_AUDIT, permApplyAuditorStrategy);
        strategyMap.put(DOC_INHCONFPERM_AUDIT, permApplyAuditorStrategy);
        strategyMap.put(BELONGDIR_INHCONFPERM_AUDIT, permApplyAuditorStrategy);
    }

    public List<DocShareStrategyAuditor> executeStrategy(String strategyType, DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        AuditorStrategy strategy = strategyMap.get(strategyType);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported strategy type: " + strategyType);
        }
        return strategy.getAuditors(docShareStrategy, procDefId, docUserId, fields);
    }
}
