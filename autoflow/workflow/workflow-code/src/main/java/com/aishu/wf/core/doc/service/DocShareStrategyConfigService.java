package com.aishu.wf.core.doc.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.wf.core.doc.dao.DocShareStrategyConfigMapper;
import com.aishu.wf.core.doc.model.DocShareStrategyConfig;
import com.aishu.wf.core.engine.core.model.dto.AdvancedSetupDTO;
import com.aishu.wf.core.engine.core.model.dto.ExpireReminderDTO;
import com.aishu.wf.core.engine.core.model.warp.ExpireReminderWarp;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DocShareStrategyConfigService extends ServiceImpl<DocShareStrategyConfigMapper, DocShareStrategyConfig>{
    
    @Resource
    private DocShareStrategyConfigMapper docShareStrategyConfigMapper;

    @Autowired
    private DocShareStrategyConfigService docShareStrategyConfigService;

    public List<DocShareStrategyConfig> listDocShareStrategyConfig(String name) {
       return docShareStrategyConfigMapper.listDocShareStrategyConfig(name);
    }

    public List<DocShareStrategyConfig> listDocShareStrategyConfigByID(String procDefID) {
        return docShareStrategyConfigMapper.selectList(new LambdaQueryWrapper<DocShareStrategyConfig>()
                .eq(DocShareStrategyConfig::getProcDefId, procDefID));
    }

    public List<DocShareStrategyConfig> listDocShareStrategyConfigByProcDefIDAndName(String procDefID, String name) {
        return docShareStrategyConfigMapper.selectList(new LambdaQueryWrapper<DocShareStrategyConfig>()
        .eq(DocShareStrategyConfig::getProcDefId, procDefID).eq(DocShareStrategyConfig::getName, name));
    }

    public void saveDocAuditStrategyConfig(String procDefId, AdvancedSetupDTO advancedSetup) throws JsonProcessingException{
        // 删除所有原有配置
        docShareStrategyConfigMapper.deleteDocShareStrategyConfig(procDefId, "");
        // 插入更新后配置
        List<DocShareStrategyConfig> configs = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.addMixIn(ExpireReminderDTO.class, ExpireReminderWarp.class);
        ExpireReminderDTO expireReminder = advancedSetup.getExpire_reminder();
        if (expireReminder != null) { 
            String configStr = objectMapper.writeValueAsString(advancedSetup.getExpire_reminder());
            JSONObject configObj = JSON.parseObject(configStr);
            for (String key : configObj.keySet()) {
                configs.add(DocShareStrategyConfig.builder()
                        .id(UUID.randomUUID().toString())
                        .procDefId(procDefId)
                        .actDefId("")
                        .name(key)
                        .value(configObj.getString(key))
                        .build());
            }
        }
        if (configs.size() == 0) {
            return;
        }
        docShareStrategyConfigService.saveBatch(configs);
    }

    public void deleteDocShareStrategyConfig(String procDefID) {
        List<DocShareStrategyConfig> configs = this.listDocShareStrategyConfigByID(procDefID);
        List<String> ids = configs.stream().filter(obj -> StrUtil.isNotBlank(obj.getActDefId()))
                .map(DocShareStrategyConfig::getId).collect(Collectors.toList());
        if (ids.size() == 0) {
            return;
        }
        docShareStrategyConfigMapper.deleteBatchIds(ids);
    }
}
