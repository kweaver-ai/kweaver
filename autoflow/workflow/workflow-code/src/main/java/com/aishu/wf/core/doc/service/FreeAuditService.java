package com.aishu.wf.core.doc.service;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.doc.dao.FreeAuditDao;
import com.aishu.wf.core.doc.model.FreeAuditModel;
import com.aishu.wf.core.doc.model.dto.FreeAuditDeptDTO;
import com.aishu.wf.core.doc.model.dto.FreeAuditDeptQueryDTO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 * @Description 免审核服务
 * @Author crzep
 * @Date 2021/4/9 16:35
 * @VERSION 1.0
 **/
@Slf4j
@Service
@Transactional
public class FreeAuditService extends ServiceImpl<FreeAuditDao, FreeAuditModel> {

    @Autowired
    FreeAuditDao freeAuditDao;
    @Autowired
    FreeAuditService freeAuditService;
    /**
     * @description 分页（搜索）
     * @author ouandyang
     * @param  search 参数
     * @updateTime 2021/5/19
     */
    public IPage<FreeAuditModel> pageSearchFreeAuditDept(FreeAuditDeptQueryDTO search) {
        IPage<FreeAuditModel> page = new Page<FreeAuditModel>(search.getPageNumber(), search.getPageSize());
        return freeAuditDao.selectPage(page, new LambdaQueryWrapper<FreeAuditModel>()
                .like(StrUtil.isNotBlank(search.getSearch()), FreeAuditModel::getDepartmentName, search.getSearch()));
    }

    /**
     * @description 新增免审核部门记录日志
     * @author ouandyang
     * @param  freeAuditModel
     * @updateTime 2021/5/19
     */
    @OperationLog(title = OperationLogConstants.ADD_FREE_AUDIT_DEPT_LOG, level = OperationLogConstants.LogLevel.NCT_LL_WARN)
    public void addFreeAuditDeptLog(FreeAuditModel freeAuditModel) {}

    /**
     * @description 添加免审部门
     * @author ouandyang
     * @param  freeAuditDeptDTOS 添加免审部门所需信息
     * @param  userId 用户id
     * @updateTime 2021/5/19
     */
    public void saveFreeAuditVos(List<FreeAuditDeptDTO> freeAuditDeptDTOS, String userId) {
        List<FreeAuditModel> list = new ArrayList<FreeAuditModel>();
        for (FreeAuditDeptDTO vo: freeAuditDeptDTOS) {
            long row = freeAuditDao.selectCount(new LambdaQueryWrapper<FreeAuditModel>()
                    .eq(FreeAuditModel::getDepartmentId, vo.getDepartment_id()));
            if (row == 0) {
                FreeAuditModel freeAuditModel = FreeAuditModel.builder()
                        .departmentId(vo.getDepartment_id())
                        .departmentName(vo.getDepartment_name())
                        .createUserId(userId)
                        .createTime(new Date()).build();
                list.add(freeAuditModel);
                freeAuditService.addFreeAuditDeptLog(freeAuditModel);
            }
        }
        if(list.isEmpty()) {
        	return;
        }
        this.saveBatch(list);
    }

    /**
     * @description 删除免审部门
     * @author ouandyang
     * @param  ids 免审部门id
     * @updateTime 2021/5/19
     */
    @OperationLog(title = OperationLogConstants.DELETE_FREE_AUDIT_DEPT_LOG, level = OperationLogConstants.LogLevel.NCT_LL_WARN)
    public void deleteFreeAuditByIds(String ids) {
        List<String> list = Arrays.asList(ids.split(StrUtil.COMMA));
        if (!list.isEmpty()) {
            freeAuditDao.deleteBatchIds(list);
        }
    }


}