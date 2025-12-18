package com.aishu.wf.core.engine.identity;

import com.aishu.wf.core.engine.identity.model.GeProperty;
import com.baomidou.mybatisplus.extension.service.IService;

public interface GePropertyService extends IService<GeProperty> {

    /**
     * @description 获取当前系统版本
     * @author hanj
     * @updateTime 2021/9/6
     */
    public String getVersion();

    /**
     * @description 更新历史系统版本
     * @author hanj
     * @param version version
     * @updateTime 2021/9/6
     */
    public void updateHistoryVersion(String version);

    /**
     * @description 更新当前系统版本
     * @author hanj
     * @param version version
     * @updateTime 2021/9/6
     */
    public void updateVersion(String version);
}
