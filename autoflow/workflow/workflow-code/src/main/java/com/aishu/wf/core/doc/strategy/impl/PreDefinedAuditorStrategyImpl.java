package com.aishu.wf.core.doc.strategy.impl;

import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.strategy.AuditorStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PreDefinedAuditorStrategyImpl implements AuditorStrategy {

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) throws Exception {
        return gpreDefinedAuditors(fields);
    }

    private List<DocShareStrategyAuditor> gpreDefinedAuditors(Map<String, Object> fields) {
        List<DocShareStrategyAuditor> result = new ArrayList<>();
        List<String> predefinedAuditorIds = new ArrayList<>();
        Object obj = fields.get("predefinedAuditorIds");
        if (obj instanceof List<?>) {
            List<?> list = (List<?>) obj;
            if (!list.isEmpty() && list.get(0) instanceof String) {
                predefinedAuditorIds = (List<String>) list;
            }
        }
        if (!predefinedAuditorIds.isEmpty()) {
            result = predefinedAuditorIds.stream()
                    .map(auditorId -> DocShareStrategyAuditor.builder().userId(auditorId).build())
                    .collect(Collectors.toList());
        }

        return result;
    }
}
