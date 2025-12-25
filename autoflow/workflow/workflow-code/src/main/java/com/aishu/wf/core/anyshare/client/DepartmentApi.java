package com.aishu.wf.core.anyshare.client;

import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

/**
 * @description 部门api调用操作
 * @author crzep
 */
@Slf4j
public class DepartmentApi {

    @Resource
    private AnyShareConfig anyShareConfig;

    private static final String ENDPOINT = "/api/user-management/v1";

    private static final String GET_DEPARTMENT_IDS = "/departments/%s/accessor_ids";

    private final ApiClient apiClient;

    public DepartmentApi(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * 获取传入部门id与父级部门id
     * @param departmentId 部门id
     * @return
     */
    public List<String> getDepartmentIdsByDeptId(String departmentId) throws Exception {
        String body = apiClient.get(ENDPOINT + String.format(GET_DEPARTMENT_IDS, departmentId));
        return JSON.parseArray(body, String.class);
    }
}