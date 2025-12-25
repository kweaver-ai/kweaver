export function getDocShareXml(processId) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.activiti.org/test">
  <process id="${processId}" name="33" isExecutable="true">
    <startEvent id="sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA" name="发起">
      <outgoing>SequenceFlow_0jfendw</outgoing>
    </startEvent>
    <userTask id="UserTask_0zz6lcw" name="审核">
      <incoming>SequenceFlow_0jfendw</incoming>
      <outgoing>SequenceFlow_08qcyby</outgoing>
    </userTask>
    <endEvent id="EndEvent_1wqgipp" name="流程结束">
      <incoming>SequenceFlow_08qcyby</incoming>
    </endEvent>
    <sequenceFlow id="SequenceFlow_0jfendw" sourceRef="sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA" targetRef="UserTask_0zz6lcw" />
    <sequenceFlow id="SequenceFlow_08qcyby" sourceRef="UserTask_0zz6lcw" targetRef="EndEvent_1wqgipp" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_demo_zdhta6966633366">
    <bpmndi:BPMNPlane id="BPMNPlane_demo_zdhta6966633366" bpmnElement="Process_3X8AGO4O">
      <bpmndi:BPMNShape id="BPMNShape_sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA" bpmnElement="sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA">
        <omgdc:Bounds x="-15" y="-235" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <omgdc:Bounds x="-1" y="-215" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_0zz6lcw_di" bpmnElement="UserTask_0zz6lcw">
        <omgdc:Bounds x="-60" y="-60" width="140" height="100" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1wqgipp_di" bpmnElement="EndEvent_1wqgipp">
        <omgdc:Bounds x="-15" y="162" width="50" height="50" />
         <bpmndi:BPMNLabel>
          <omgdc:Bounds x="-12" y="180" width="44" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_0jfendw_di" bpmnElement="SequenceFlow_0jfendw">
        <di:waypoint x="10" y="-185" />
        <di:waypoint x="10" y="-60" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="SequenceFlow_08qcyby_di" bpmnElement="SequenceFlow_08qcyby">
        <di:waypoint x="10" y="40" />
        <di:waypoint x="10" y="160" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`
}
