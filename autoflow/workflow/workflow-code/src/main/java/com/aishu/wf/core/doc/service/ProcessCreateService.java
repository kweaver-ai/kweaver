package com.aishu.wf.core.doc.service;

import cn.hutool.core.codec.Base64;
import com.aishu.wf.core.common.model.CreateProcessDTO;
import com.aishu.wf.core.common.model.CreateStrategyAuditorDTO;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.common.util.CreateProcessUtils;
import com.aishu.wf.core.common.util.WorkflowConstants;
import com.aishu.wf.core.doc.model.dto.DocShareStrategyAuditorDTO;
import com.aishu.wf.core.doc.model.dto.DocShareStrategyDTO;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import com.aishu.wf.core.engine.core.model.dto.ProcessDeploymentDTO;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import com.aishu.wf.core.engine.identity.RoleService;
import com.aishu.wf.core.engine.identity.model.Role;
import com.aishu.wf.core.engine.util.WorkFlowException;
import lombok.extern.slf4j.Slf4j;
import org.dom4j.DocumentException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/4/22 16:32
 */
@Slf4j
@Service
public class ProcessCreateService {

    @Autowired
    private ProcessDefinitionService processDefinitionService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private CreateProcessUtils createProcessUtils;

    /**
     * @description 创建新流程
     * @author hanj
     * @param createProcessDTO createProcessDTO
     * @param userId userId
     * @updateTime 2022/4/22
     */
    public String createNewProcess(CreateProcessDTO createProcessDTO, String userId) {
        if(!WorkflowConstants.WORKFLOW_TYPE_SYNC.equals(createProcessDTO.getProcess_type())){
            throw new WorkFlowException(ExceptionErrorCode.B2001, "当前流程类型暂不支持新建流程");
        }
        if(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue().equals(createProcessDTO.getStrategy_type())){
            if(createProcessDTO.getAuditor_list().size() == 0){
                throw new WorkFlowException(ExceptionErrorCode.B2001, "指定用户审核时，审核员不能为空");
            }
        } else if(WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue().equals(createProcessDTO.getStrategy_type())){
            Role role = roleService.getRoleById(createProcessDTO.getRule_id());
            if(null == role){
                throw new WorkFlowException(ExceptionErrorCode.B2001, "部门审核员时，未查询到对应的部门审核员规则");
            }
        }
        CreateProcessDTO newProcess = null;
        try {
            newProcess = createProcessUtils.getBaseProcessByXml(createProcessDTO);
        } catch (DocumentException e) {
            log.warn("创建新流程，根据流程基础xml转换新流程信息失败！异常为：" + e.getMessage(), e);
        }
        ProcessDeploymentDTO processDeploymentDTO = new ProcessDeploymentDTO();
        processDeploymentDTO.setName(newProcess.getProcess_name());
        processDeploymentDTO.setKey(newProcess.getProcess_key());
        processDeploymentDTO.setTenant_id(CommonConstants.TENANT_AS_WORKFLOW);
        processDeploymentDTO.setType(createProcessDTO.getProcess_type());
        processDeploymentDTO.setType_name("文档同步审核");

        // 流程xml转Base64
        String flowXml = Base64.encode(createProcessDTO.getProcess_xml());
        processDeploymentDTO.setFlow_xml(flowXml);

        // 构建审核策略参数
        List<DocShareStrategyDTO> strategyList = bulidStrategyList(createProcessDTO.getAuditor_list(), createProcessDTO);
        processDeploymentDTO.setAudit_strategy_list(strategyList);
        AdvancedSetupDTO advancedSetupDTO = new AdvancedSetupDTO();
        advancedSetupDTO.setRepeat_audit_rule("always");
        processDeploymentDTO.setAdvanced_setup(advancedSetupDTO);

        return processDefinitionService.deployProcess(processDeploymentDTO, "new", userId);
    }

    /**
     * @description 新建流程，构建审核策略参数
     * @author hanj
     * @param createAuditList createAuditList
     * @param createProcessDTO createProcessDTO
     * @updateTime 2022/4/22
     */
    private List<DocShareStrategyDTO> bulidStrategyList(List<CreateStrategyAuditorDTO> createAuditList, CreateProcessDTO createProcessDTO){
        List<DocShareStrategyDTO> strategyList = new ArrayList<>();
        DocShareStrategyDTO docShareStrategyDTO = new DocShareStrategyDTO();
        docShareStrategyDTO.setRepeat_audit_type("always");
        docShareStrategyDTO.setNo_auditor_type("auto_reject");
        if(WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue().equals(createProcessDTO.getStrategy_type())){
            docShareStrategyDTO.setRule_id(createProcessDTO.getRule_id());
            docShareStrategyDTO.setRule_type("role");
        }
        docShareStrategyDTO.setStrategy_type(createProcessDTO.getStrategy_type());
        docShareStrategyDTO.setAct_def_id(createProcessDTO.getAct_def_id());
        docShareStrategyDTO.setAct_def_name(createProcessDTO.getAct_def_name());
        docShareStrategyDTO.setAudit_model("tjsh");
        List<DocShareStrategyAuditorDTO> auditorList = new ArrayList<>();
        List<CreateStrategyAuditorDTO> createAuditorList = createAuditList;
        for (CreateStrategyAuditorDTO createAuditor : createAuditorList) {
            DocShareStrategyAuditorDTO auditorDTO = CreateStrategyAuditorDTO.builder(createAuditor);
            auditorList.add(auditorDTO);
        }
        docShareStrategyDTO.setAuditor_list(auditorList);
        docShareStrategyDTO.setCreate_time(new Date());
        docShareStrategyDTO.setCreate_user_id("system");
        docShareStrategyDTO.setProc_def_name(createProcessDTO.getProcess_name());
        strategyList.add(docShareStrategyDTO);
        return strategyList;
    }
}
