package com.aishu.wf.core.common.util;

import cn.hutool.core.util.XmlUtil;
import com.aishu.wf.core.common.model.CreateProcessDTO;
import com.aishu.wf.core.common.model.CreateStrategyAuditorDTO;
import com.aishu.wf.core.engine.core.model.ExceptionErrorCode;
import com.aishu.wf.core.engine.util.WorkFlowException;
import org.dom4j.DocumentException;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.io.InputStream;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/4/22 15:07
 */
@Component
public class CreateProcessUtils {

    /**
     * @description 根据流程基础xml转换新流程信息失败
     * @author hanj
     * @param createProcessDTO createProcessDTO
     * @updateTime 2022/4/22
     */
    public CreateProcessDTO getBaseProcessByXml(CreateProcessDTO createProcessDTO) throws DocumentException {
        InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream("process/process.xml");
        Document document = XmlUtil.readXML(inputStream);
        List<Element> elementList = XmlUtil.getElements(document.getDocumentElement(), "process");
        if(elementList.size() == 0){
            throw new WorkFlowException(ExceptionErrorCode.A1000, "获取流程xml模板解析异常");
        }

        String strategyType = createProcessDTO.getStrategy_type();
        // 设置环节审核员
        String candidateUsers = "";
        List<CreateStrategyAuditorDTO> auditorDTOList = createProcessDTO.getAuditor_list();
        List<String> auditorIdList = auditorDTOList.stream().map(CreateStrategyAuditorDTO::getUser_id).collect(Collectors.toList());
        if(WorkflowConstants.STRATEGY_TYPE.NAMED_AUDITOR.getValue().equals(strategyType)){
            // 只需设置一个审核员ID，用于校验，审核员实际从策略表中获取
            candidateUsers = auditorIdList.size() > 0 ? auditorIdList.get(0) : "";
        } else if(WorkflowConstants.STRATEGY_TYPE.DEPT_AUDITOR.getValue().equals(strategyType)){
            candidateUsers = createProcessDTO.getRule_id();
        }

        Element proceeElement = elementList.get(0);
        String processId = "Process_" + genRandomStr();
        String userTaskId = "UserTask_" + genRandomStr();
        proceeElement.setAttribute("id", processId);
        proceeElement.setAttribute("name", createProcessDTO.getProcess_name());
        List<Element> userTaskElementList = XmlUtil.getElements(proceeElement, "userTask");
        List<Element> sequenceFlowElementList = XmlUtil.getElements(proceeElement, "sequenceFlow");
        for (Element userTaskElement: userTaskElementList) {
            userTaskElement.setAttribute("id", userTaskId);
            userTaskElement.setAttribute("activiti:candidateUsers", candidateUsers);
        }
        for (Element sequenceFlowElement: sequenceFlowElementList) {
            if("sid-start-node".equals(sequenceFlowElement.getAttribute("sourceRef"))){
                sequenceFlowElement.setAttribute("targetRef", userTaskId);
            } else if("EndEvent_1wqgipp".equals(sequenceFlowElement.getAttribute("targetRef"))){
                sequenceFlowElement.setAttribute("sourceRef", userTaskId);
            }
        }
        String processXml = XmlUtil.toStr(document);
        createProcessDTO.setProcess_xml(processXml);
        createProcessDTO.setProcess_key(processId);
        createProcessDTO.setAct_def_id(userTaskId);
        createProcessDTO.setAct_def_name("审核");
        return createProcessDTO;
    }

    /**
     * @description 生产8位随机字符数字随机码
     * @author hanj
     * @updateTime 2022/4/22
     */
    public String genRandomStr(){
        int  maxNum = 62;
        int i;
        int count = 0;
        char[] str = { 'A', 'B', '3','C', 'D', 'E', 'F', '8','G', 'H', 'I', 'J', 'K',
                '1', '2', 'L', 'M', 'N', 'O', 'P', '7', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
                'X', 'Y', 'Z', '4', 'a', 'b', 'c', 'd', 'e', 'f', '9', 'g', 'h', 'i', 'j',
                'k', 'l', '5', 'm', 'n', 'o', 'p', '6','q', 'r', 's', 't', 'u', '0','v', 'w',
                'x', 'y', 'z'};
        StringBuffer pwd = new StringBuffer("");
        Random r = new Random();
        while(count < 8){
            i = Math.abs(r.nextInt(maxNum));
            if (i >= 0 && i < str.length) {
                pwd.append(str[i]);
                count ++;
            }
        }
        return pwd.toString();
    }
}
