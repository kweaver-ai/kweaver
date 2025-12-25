package com.aishu.wf.core.engine.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import com.aishu.wf.core.engine.identity.model.Org;

public class ComparatorOrg implements Comparator<Org>{

	@Override
	public int compare(Org org1, Org org2) {
		Integer val1=0;
		Integer val2=0;
		if(org1==null||org1.getOrgSort()==null){
			return val2;
		}
		if(org2==null||org2.getOrgSort()==null){
			return val1;
		}
		val1=org1.getOrgSort();
		val2=org2.getOrgSort();
		return val1.compareTo(val2);
	}

}

