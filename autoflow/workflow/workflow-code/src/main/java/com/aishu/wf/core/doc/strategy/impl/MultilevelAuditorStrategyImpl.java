package com.aishu.wf.core.doc.strategy.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.DocShareStrategyAuditor;
import com.aishu.wf.core.doc.model.dto.ContivuousMultilevelDTO;
import com.aishu.wf.core.doc.strategy.AuditorStrategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
@Service
public class MultilevelAuditorStrategyImpl implements AuditorStrategy {
        
    @Autowired
    private StrategyUtils strategyUtils;

    @Override
    public List<DocShareStrategyAuditor> getAuditors(DocShareStrategy docShareStrategy, String procDefId, String docUserId, Map<String, Object> fields) {
        // 实现多级审核策略
        return multilevelGetAuditors(docShareStrategy, docUserId);
    }
    

    /**
     * @description 连续多级审核，获取审核员（用于自动审核/自动拒绝校验是否存在审核员）
     * @author hanj
     * @param docShareStrategy docShareStrategy
     * @updateTime 2022/2/24
     */
    private List<DocShareStrategyAuditor> multilevelGetAuditors(DocShareStrategy docShareStrategy, String docUserId){
    	List<ContivuousMultilevelDTO> contivuousMultilevelList = strategyUtils.queryContinuousMultilevelStrategy(docShareStrategy.getProcDefId(),
    			docShareStrategy.getActDefId(), docUserId);
        List<DocShareStrategyAuditor> auditorList = new ArrayList<>();
        for (ContivuousMultilevelDTO contivuousMultilevelDTO : contivuousMultilevelList) {
        	contivuousMultilevelDTO.getMultilevelAssigneeList().forEach(e -> {
        		DocShareStrategyAuditor auditor = new DocShareStrategyAuditor();
            	auditor.setUserId(e);
            	auditorList.add(auditor);
        	});
		}
        return auditorList;
    }
}
