package com.aishu.wf.core.doc.strategy;

import java.util.List;
import java.util.Map;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;

public interface AuditorStrategy {
    List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception;
}