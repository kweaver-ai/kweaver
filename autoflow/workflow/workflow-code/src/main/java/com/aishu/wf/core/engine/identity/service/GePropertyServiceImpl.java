package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.engine.identity.GePropertyService;
import com.aishu.wf.core.engine.identity.dao.GePropertyDao;
import com.aishu.wf.core.engine.identity.dao.OrgQueryDao;
import com.aishu.wf.core.engine.identity.model.GeProperty;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service("GePropertyServiceImpl")
public class GePropertyServiceImpl extends ServiceImpl<GePropertyDao, GeProperty> implements GePropertyService {

    @Autowired
    private GePropertyDao gePropertyDao;

    @Override
    public String getVersion() {
        GeProperty geProperty = gePropertyDao.selectOne(new LambdaQueryWrapper<GeProperty>()
                .eq(GeProperty::getName_, "schema.version"));
        if(null == geProperty){
            return "";
        }
        return geProperty.getValue();
    }

    @Override
    public void updateHistoryVersion(String historyVersion) {
        GeProperty geProperty = new GeProperty();
        geProperty.setName_("schema.history");
        geProperty.setValue(historyVersion);
        gePropertyDao.updateById(geProperty);
    }

    @Override
    public void updateVersion(String version) {
        GeProperty geProperty = new GeProperty();
        geProperty.setName_("schema.version");
        geProperty.setValue(version);
        gePropertyDao.updateById(geProperty);
    }
}
