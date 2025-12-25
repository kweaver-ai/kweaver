package com.aishu.wf.core.engine.util;

import java.util.Comparator;

import org.activiti.bpmn.model.ExpandProperty;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.process.TransitionImpl;


public class ComparatorTransition  implements Comparator<PvmTransition>{

	@Override
	public int compare(PvmTransition pvm1, PvmTransition pvm2) {
		TransitionImpl transition1=(TransitionImpl) pvm1;
		TransitionImpl transition2=(TransitionImpl) pvm2;
		ExpandProperty expandProperty1=ProcessDefinitionUtils.findTransitionOrder(transition1);
		ExpandProperty expandProperty2=ProcessDefinitionUtils.findTransitionOrder(transition2);
		String val1="99";
		String val2="99";
		if(expandProperty1!=null){
			val1=expandProperty1.getValue();
		}
		if(expandProperty2!=null){
			val2=expandProperty2.getValue();
		}
		return val1.compareTo(val2);
	}
}
