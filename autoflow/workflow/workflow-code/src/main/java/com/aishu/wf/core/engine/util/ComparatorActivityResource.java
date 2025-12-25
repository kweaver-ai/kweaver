package com.aishu.wf.core.engine.util;

import com.aishu.wf.core.engine.core.model.ActivityResourceModel;
import com.aishu.wf.core.engine.identity.model.Org;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class ComparatorActivityResource implements Comparator<ActivityResourceModel> {

    @Override
    public int compare(ActivityResourceModel ar1, ActivityResourceModel ar2) {
        Integer val1 = 0;
        Integer val2 = 0;
        if (ar1 == null || ar1.getSort() == null) {
            return val2;
        }
        if (ar1 == null || ar1.getSort() == null) {
            return val1;
        }
        val1 = ar1.getSort();
        val2 = ar2.getSort();
        return val1.compareTo(val2);
    }

    public static void main(String[] args) {
        List<Org> ts = new ArrayList<Org>();
        Org t1 = new Org();
        t1.setOrgId("o1");
        t1.setOrgSort(3);
        Org t2 = new Org();
        t2.setOrgId("o2");
        t2.setOrgSort(2);
        Org t3 = new Org();
        t3.setOrgId("o3");
        t3.setOrgSort(1);
        ts.add(t1);
        ts.add(t2);
        ts.add(t3);
        Collections.sort(ts, new ComparatorOrg());
    }
}
	