package com.aishu.wf.core.config;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.util.RedisUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.aishu.wf.core.engine.core.model.dto.ProcessCategoryDTO;
import com.aishu.wf.core.common.util.CommonConstants;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collector;

/**
 * @description 审核配置
 * @author hanj
 */
@Slf4j
@Data
@Component
public class AuditConfig {

    @Autowired
    private RedisUtil redisUtil;

    public static final String HEAD_JSON = "headJson";

    public static final String HEAD_SVG = "headSvg";

    public static final String HEAD_PNG = "headPng";

    public static final String AUDIT_PLUGIN_JSON = "auditPluginJson";

    /**
     * 插件信息
     */
    private String pluginInfo;

    /**
     * 邮件模板背景图
     */
    private String mailHeadImg;

    /**
     * 邮件模板基础配置信息
     */
    private String mailConfig;

    public List<Object> getFrontPlugin(ProcessCategoryDTO queryDTO){
        String tenantId = queryDTO.getTenant_id();
        if (tenantId == null) {
            tenantId = CommonConstants.TENANT_AS_WORKFLOW;
        }
        List<Object> frontPluginList  = new ArrayList<>();
        try {
            String pluginInfoJsonStr = redisUtil.get(AUDIT_PLUGIN_JSON);
            JSONObject frontPluginJsonObj = JSONUtil.parseObj(pluginInfoJsonStr);
            JSONArray jsonArray = JSONUtil.parseArray(frontPluginJsonObj.getStr("front_plugin_info"));
            for (int i = 0; i < jsonArray.size(); ++i) {
                JSONObject obj = jsonArray.getJSONObject(i);
                String id = obj.getStr("tenant_id");
                if (id == null) {
                    id = CommonConstants.TENANT_AS_WORKFLOW;
                }
                if (tenantId.equals(id)) {
                    frontPluginList.add(obj);
                }
            }
        } catch (Exception e) {
            log.warn("获取审核配置前端审核详情插件配置信息集合失败=={error:{}}", e.getMessage());
        }
        return frontPluginList;
    }


    public List<JSONObject> getAuditorPlugin(){
        List<JSONObject> frontPluginList  = new ArrayList<>();
        try {
            String pluginInfoJsonStr = redisUtil.get(AUDIT_PLUGIN_JSON);
            JSONObject auditorPluginJsonObj = JSONUtil.parseObj(pluginInfoJsonStr);
            JSONArray jsonArray = JSONUtil.parseArray(auditorPluginJsonObj.getStr("auditor_plugin_info"));
            for (int i = 0; i < jsonArray.size(); ++i) {
                JSONObject obj = jsonArray.getJSONObject(i);
                frontPluginList.add(obj);
            }
        } catch (Exception e) {
            log.warn("获取审核配置前端审核详情插件自定义审核项配置信息集合失败=={error:{}}", e.getMessage());
        }
        return frontPluginList;
    }



    public String builderFrontPlugin(String applyType){
        String frontPluginJsonStr = "";
        try {
            String pluginInfoJsonStr = redisUtil.get(AUDIT_PLUGIN_JSON);
            JSONObject frontPluginJsonObj = JSONUtil.parseObj(pluginInfoJsonStr);
            JSONArray jsonArray = JSONUtil.parseArray(frontPluginJsonObj.getStr("front_plugin_info"));
            for(Object jsonObject : jsonArray){
                JSONObject frontPlugin = JSONUtil.parseObj(jsonObject);
                Object auditType = frontPlugin.get("audit_type");
                if (auditType instanceof String && auditType.equals(applyType)) {
                    frontPluginJsonStr = JSONUtil.toJsonStr(frontPlugin);
                    break;
                } else if (auditType instanceof JSONArray && ((JSONArray)auditType).contains(applyType)) {
                    frontPluginJsonStr = JSONUtil.toJsonStr(frontPlugin);
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("审核配置构建前端审核详情插件配置信息失败=={error:{}, applyType:{}}", e.getMessage(), applyType);
        }
        return frontPluginJsonStr;
    }

    public Object builderMailConfig(String key){
        try {
            String mailConfigJsonStr = redisUtil.get(HEAD_JSON);
            JSONObject mailConfigJsonObj = JSONUtil.parseObj(mailConfigJsonStr);
            if(mailConfigJsonObj.containsKey(key)){
                return mailConfigJsonObj.get(key);
            }
        } catch (Exception e) {
            log.warn("审核配置构建邮件模板基础配置信息失败=={error:{}, key:{}}", e.getMessage(), key);
        }
        return null;
    }

    public Object builderMailHeadSvg(){
        try {
            String mailHeadSvg = redisUtil.get(HEAD_SVG);
            return mailHeadSvg;
        } catch (Exception e) {
            log.warn("审核配置构建邮件模板基础配置信息失败=={error:{}}", e.getMessage());
        }
        return "";
    }

    public String builderMailHeadPng(){
        try {
            String mailHeadPng = redisUtil.get(HEAD_PNG);
            return mailHeadPng;
        } catch (Exception e) {
            log.warn("审核配置构建邮件模板基础配置信息失败=={error:{}}", e.getMessage());
        }
        return "";
    }
}
