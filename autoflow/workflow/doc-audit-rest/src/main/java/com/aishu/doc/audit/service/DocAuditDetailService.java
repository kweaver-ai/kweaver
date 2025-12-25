package com.aishu.doc.audit.service;

import com.aishu.doc.audit.dao.DocAuditDetailDao;
import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.doc.common.DocUtils;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @description 文档审核明细服务类
 * @author ouandyang
 */
@Slf4j
@Service
public class DocAuditDetailService extends ServiceImpl<DocAuditDetailDao, DocAuditDetailModel> {

    @Autowired
    DocAuditDetailDao docAuditDetailDao;
    /**
     * @description 批量保存文档信息
     * @author ouandyang
     * @param  list 文档信息
     * @param  applyId 申请ID
     * @updateTime 2021/5/22
     */
    public void batchSave(List<DocAuditDetailModel> list, String applyId) {
        list.forEach(t -> t.setApplyId(applyId));
        list.forEach(t -> t.setDocName(DocUtils.getDocNameByPath(t.getDocPath())));
        this.saveBatch(list);
    }

}
