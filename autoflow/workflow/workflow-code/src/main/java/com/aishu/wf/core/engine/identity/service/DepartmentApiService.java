package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.DepartmentApi;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.List;

/**
 * @Description 部门服务
 * @Author crzep
 * @Date 2021/4/15 19:06
 * @VERSION 1.0
 **/
@Service
public class DepartmentApiService {

    @Resource
    private AnyShareConfig anyShareConfig;

    private DepartmentApi departmentApi;

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        departmentApi = anyShareClient.getDepartmentApi();
    }

    /**
     * 获取部门ID与父部门ID集合
     *
     * @param deptId 部门ID
     * @return 直属部门ID集合
     * @throws Exception
     */
    public List<String> getDepartmentIdsByDeptId(String deptId) throws Exception {
        return departmentApi.getDepartmentIdsByDeptId(deptId);
    }

}

