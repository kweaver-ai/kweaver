export function getDefaultXml(processId) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:activiti="http://activiti.org/bpmn" targetNamespace="http://www.activiti.org/test">
  <process id="${processId}" isExecutable="true">
    <startEvent id="sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA">
      <outgoing>SequenceFlow_0jfendw</outgoing>
    </startEvent>
    <userTask id="UserTask_0zz6lcw" name="审核">
      <incoming>SequenceFlow_0jfendw</incoming>
      <outgoing>SequenceFlow_08qcyby</outgoing>
    </userTask>
    <endEvent id="EndEvent_1wqgipp">
      <incoming>SequenceFlow_08qcyby</incoming>
    </endEvent>
    <sequenceFlow id="SequenceFlow_0jfendw" sourceRef="sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA" targetRef="UserTask_0zz6lcw" />
    <sequenceFlow id="SequenceFlow_08qcyby" sourceRef="UserTask_0zz6lcw" targetRef="EndEvent_1wqgipp" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_demo_zdhta6966633366">
    <bpmndi:BPMNPlane id="BPMNPlane_demo_zdhta6966633366" bpmnElement="Process_OYXL5S7Y">
      <bpmndi:BPMNShape id="BPMNShape_sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA" bpmnElement="sid-46588EAA-38B7-4FBC-80DD-46A5EFE26CFA">
        <omgdc:Bounds x="425" y="135" width="30" height="30" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_0zz6lcw_di" bpmnElement="UserTask_0zz6lcw">
        <omgdc:Bounds x="580" y="110" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1wqgipp_di" bpmnElement="EndEvent_1wqgipp">
        <omgdc:Bounds x="772" y="132" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="SequenceFlow_0jfendw_di" bpmnElement="SequenceFlow_0jfendw">
        <di:waypoint x="455" y="150" />
        <di:waypoint x="580" y="150" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="SequenceFlow_08qcyby_di" bpmnElement="SequenceFlow_08qcyby">
        <di:waypoint x="680" y="150" />
        <di:waypoint x="772" y="150" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`
}