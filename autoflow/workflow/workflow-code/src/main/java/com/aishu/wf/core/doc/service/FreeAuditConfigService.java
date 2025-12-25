package com.aishu.wf.core.doc.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.common.RespMsg;
import com.aishu.wf.core.doc.dao.FreeAuditDao;
import com.aishu.wf.core.doc.model.FreeAuditConfigModel;
import com.aishu.wf.core.doc.model.FreeAuditModel;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.identity.service.DepartmentApiService;
import com.aishu.wf.core.engine.identity.service.UserManagementService;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import lombok.extern.slf4j.Slf4j;

/**
 * @description 免审配置服务
 * @author crzep
 */
@Slf4j
@Service
public class FreeAuditConfigService{

    @Autowired
    FreeAuditDao freeAuditDao;
    @Autowired
    DictService dictService;
    @Autowired
    FreeAuditService freeAuditService;
    @Autowired
    UserManagementService userManagementService;
    @Autowired
    DepartmentApiService departmentApiService;

    /**
     * @description 查询本部门免审状态
     * @author crzep
     * @updateTime 2021/5/19
     */
    public String getSelfDeptFreeAuditState() {
        Dict dict = dictService.findDictByCode(DocConstants.SELF_DEPT_FREE_AUDIT);
        return dict.getDictName();
    }

    /**
     * @description 修改本部门免审接口
     * @author crzep
     * @param  state
     * @updateTime 2021/5/19
     */
    public void updateSelfDeptFreeAuditState(String state) {
        Dict dict = dictService.findDictByCode(DocConstants.SELF_DEPT_FREE_AUDIT);
        dict.setDictName(state);
        dictService.saveDict(dict);
    }

    /**
     * @description 查询允许本部门免密共享的密级级别
     * @author crzep
     * @updateTime 2021/5/19
     */
    public Map<String,Integer> getSecurityLevelAll() {
        Map<String,Integer> map=new HashMap<>();
        JSONObject object=getNotNullSecretLevelDictByCode();
        Set<String> its=object.keySet();
        for (String str:its){
            map.put(str,Integer.parseInt(object.getString(str)));
        }
        return map;
    }

    /**
     * @description 修改免审核配置
     * @author ouandyang
     * @param  config 免审核配置
     * @updateTime 2021/5/25
     */
    public void saveConfig(FreeAuditConfigModel config) {
        this.updateSecurityLevelSet(config.getCsf_level());
        this.updateSelfDeptFreeAuditState(config.getDepartment_avoid_status());
    }

    /**
     * @description 更新当前设置的免密共享密集级别
     * @author crzep
     * @param  securityLevel 被设置的密集级别
     * @updateTime 2021/5/19
     */
    public void updateSecurityLevelSet(Integer securityLevel) {
        // 查询并比较
        Map<String,Integer> levels=getSecurityLevelAll();
        boolean flag=false;
        for (String level : levels.keySet()) {
            if (levels.get(level).equals(securityLevel)) {
                flag = true;
                break;
            }
        }
        // 判断传入参数并更新
        Dict dict=getNotNullSetSecretLevelDictByCode();
        if (!flag){
            throw new RestException(RespMsg.WORKFLOW_FREE_AUDIT_LEVEL_ILLEGALARGUMENT_CODE,
                    String.format(RespMsg.WORKFLOW_FREE_AUDIT_LEVEL_ILLEGALARGUMENT, securityLevel));
        }
        dict.setDictName(String.valueOf(securityLevel));
        if (!dictService.saveDict(dict)) {
            throw new RestException("操作失败，请重试！");
        }

    }

    /**
     * @description 判断是否小于等于设置的密级
     * @author crzep
     * @param  csfLevelCode
     * @updateTime 2021/5/19
     */
    public boolean isSmallOrEqSetLevel(int csfLevelCode)  {
        int setLevel=Integer.parseInt(getNotNullSetSecretLevelDictByCode().getDictName());
        return csfLevelCode<=setLevel;
    }

    /**
     * @description 查询设置的共享密级
     * @author crzep
     * @updateTime 2021/5/19
     */
    public Integer getSetSecurityLevel() {
        Dict dict=getNotNullSetSecretLevelDictByCode();
        return Integer.valueOf(dict.getDictName());
    }

    /**
     * @description 获取当前设置的密级级别字典
     * @author crzep
     * @updateTime 2021/5/19
     */
    private Dict getNotNullSetSecretLevelDictByCode() {
        Dict dict = dictService.findDictByCode(DocConstants.FREE_AUDIT_SECRET_LEVEL);
        if (null == dict) {
            throw new RestException(RespMsg.WORKFLOW_FREE_AUDIT_DICT_NOT_FOUND_CODE,
                    String.format(RespMsg.WORKFLOW_FREE_AUDIT_DICT_NOT_FOUND,
                            DocConstants.FREE_AUDIT_SECRET_LEVEL_ENUM));
        }
        return dict;
    }

    /**
     * @description 获取非空所有的密级级别代码
     * @author crzep
     * @param
     * @updateTime 2021/5/19
     */
    private JSONObject getNotNullSecretLevelDictByCode() {
        Dict dict = dictService.findDictByCode(DocConstants.FREE_AUDIT_SECRET_LEVEL_ENUM);
        if (null == dict) {
            throw new RestException(RespMsg.WORKFLOW_FREE_AUDIT_DICT_NOT_FOUND_CODE,
                    String.format(RespMsg.WORKFLOW_FREE_AUDIT_DICT_NOT_FOUND,
                            DocConstants.FREE_AUDIT_SECRET_LEVEL_ENUM));
        }
        String dictName = dict.getDictName().replace("\\", "");
        return JSONObject.parseObject(dictName);
    }

    /**
     * @description 免审核校验接口
     * @author crzep
     * @param  csfLevelCode 密级
     * @param  shareUserId 共享者ID
     * @param  accessorId 访问者ID
     * @param  accessorType 访问者类型
     * @updateTime 2021/5/19
     */
    public boolean verdictDeptFreeAudit(int csfLevelCode,String shareUserId, String accessorId,
                                        String accessorType ) {
        if (!isSmallOrEqSetLevel(csfLevelCode)){
            return false;
        }
        // 获取共享者的直属部门id
        List<String> shares=getNoNullDeptListByUserId(shareUserId);
        // 获取访问者的直属部门id集合
        List<String> access;
        // 判断访问者类型并查询其所在的父部门再进入判断
        if (DocConstants.FREE_AUDIT_ACCESS_USER.equals(accessorType)){
            access=getNoNullDeptListByUserId(accessorId);
        }else if (DocConstants.FREE_AUDIT_ACCESS_DEPARTMENT.equals(accessorType)){
            // 包含本部门id
            access=getNoNullDeptListByDeptId(accessorId);
        }else{
            return false;
        }
        List<String> comm = new ArrayList<>(shares);
        // 集合是否发生变化
        boolean share=comm.retainAll(access);
        // 同部门且直属部门免审开启则免审
        if (!share && DocConstants.FREE_AUDIT_SWITCH_ENABLE.equals(getSelfDeptFreeAuditState())){
            return true;
        }
        // 无交集则需要验证
        if (comm.isEmpty()){
            return false;
        }
        // 判断共享者与访问者的交集部门中是否被设置
        List<FreeAuditModel> list= freeAuditDao.selectList(new QueryWrapper<FreeAuditModel>().in("DEPARTMENT_ID",
                comm));
        return !list.isEmpty();
    }

    /**
     * @description 获取部门的及其父部门
     * @author crzep
     * @param  depteId 部门id
     * @updateTime 2021/5/19
     */
    private List<String> getNoNullDeptListByDeptId(String depteId) {
        List<String> departIds;
        try {
            departIds=departmentApiService.getDepartmentIdsByDeptId(depteId);
        } catch (Exception e) {
            log.debug(e.getMessage());
            throw new RestException("操作失败，远程服务异常！");
        }
        if (null == departIds || departIds.isEmpty()){
            throw new RestException("操作失败，未找到共享者部门信息！");
        }
        return departIds;
    }

    /**
     * @description 获取用户的所有父部门id
     * @author crzep
     * @param  userId 用户id
     * @updateTime 2021/5/19
     */
    private List<String> getNoNullDeptListByUserId(String userId) {
        List<String> departIds;
        try {
            departIds=userManagementService.getDepartmentIdsByUserId(userId);
        } catch (Exception e) {
            log.debug(e.getMessage());
            throw new RestException("操作失败，远程服务异常！");
        }
        if (null == departIds || departIds.isEmpty()){
            throw new RestException("操作失败，未找到共享者部门信息！");
        }
        return departIds;
    }

    /**
     * @description 查询页面配置
     * @author crzep
     * @updateTime 2021/5/19
     */
    public FreeAuditConfigModel getConfig() {
        FreeAuditConfigModel freeAuditConfigModel =new FreeAuditConfigModel();
        // 修改传出数据结构--键值反转
        Map<String,Integer> map=getSecurityLevelAll();
        List<JSONObject> list=new ArrayList<>();
        for (String str:map.keySet()){
            JSONObject jsonObject=new JSONObject();
            jsonObject.put("lv",String.valueOf(map.get(str)));
            jsonObject.put("name",str);
            list.add(jsonObject);
        }
        freeAuditConfigModel.setCsf_levels(list);
        freeAuditConfigModel.setCsf_level(getSetSecurityLevel());
        freeAuditConfigModel.setDepartment_avoid_status(getSelfDeptFreeAuditState());
        return freeAuditConfigModel;
    }

}