package com.aishu.wf.core.doc.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import com.aishu.wf.core.common.config.CustomConfig;
import com.aishu.wf.core.doc.model.ThirdAuditModel;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.config.model.DictChild;
import com.aishu.wf.core.engine.config.service.DictService;
import com.aishu.wf.core.engine.core.model.dto.ThirdAuditConfigDTO;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Date;
import java.util.List;

/**
 * 第三方审核配置类
 *
 * @author Liuchu
 * @since 2021-2-23 18:13:56
 */
@Slf4j
@Service
public class ThirdAuditConfigService {

    private final static String THIRD_AUDIT_CONFIG_DICT_CODE = "dsf_audit_config";
    private final static String THIRD_AUDIT_CONFIG_DICT_NAME = "第三方审核配置";

    private final static String IS_OPEN = "isOpen";
    private final static String WEBHOOK_URL = "webhookUrl";

    @Resource
    private DictService dictService;
    @Resource
    private CustomConfig customConfig;

    /**
     * 测试webhook回调地址连通性
     *
     * @param url 回调地址
     * @return
     */
    public Boolean testWebhookConfig(String url) {
        String body = null;
        try {
            body = HttpUtil.get(url, 1500);
        } catch (Exception e) {
            log.warn("第三方审核Webhook地址Url[{}]无法访问！原因：{}", url, e.getMessage());
        }
        if (body == null) {
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    /**
     * 获取第三方审核配置
     *
     * @return
     */
    public ThirdAuditConfigDTO getThirdAuditConfig() {
        ThirdAuditConfigDTO result = ThirdAuditConfigDTO.builder().is_open(false).build();
        Dict dict = dictService.findDictByCode(THIRD_AUDIT_CONFIG_DICT_CODE);
        if (dict != null) {
            List<DictChild> dictValue = dict.getDictValue();
            String jsonString = JSON.toJSONString(dictValue);
            List<DictChild> childList = JSON.parseArray(jsonString, DictChild.class);
            for (DictChild dictChild : childList) {
                if (IS_OPEN.equals(dictChild.getDictCode())) {
                    result.setIs_open(Boolean.parseBoolean(dictChild.getDictName()));
                }
                if (WEBHOOK_URL.equals(dictChild.getDictCode())) {
                    result.setWebhook_url(dictChild.getDictName());
                }
            }
        }
        return result;
    }

    /**
     * 保存第三方审核配置
     *
     * @param config 第三方配置对象
     */
    public void saveThirdAuditConfig(ThirdAuditConfigDTO config) {
        Dict dict = dictService.findDictByCode(THIRD_AUDIT_CONFIG_DICT_CODE);

        List<DictChild> childList = Lists.newArrayList();
        DictChild isOpen = DictChild.builder().dictCode(IS_OPEN).dictName(config.getIs_open().toString()).sort(1).build();
        DictChild webhookUrl = DictChild.builder().dictCode(WEBHOOK_URL).dictName(config.getWebhook_url()).sort(2).build();
        childList.add(isOpen);
        childList.add(webhookUrl);
        if (dict == null) {
            // 新增字典
            dict = Dict.builder().dictCode(THIRD_AUDIT_CONFIG_DICT_CODE).dictName(THIRD_AUDIT_CONFIG_DICT_NAME)
                    .dictParentId("1").sort(1).status("Y").creatorId("").createDate(new Date())
                    .appId(customConfig.getTenantId()).build();
        } else {
            // 修改字典值
            dict.setUpdatorId("");
            dict.setUpdateDate(new Date());
        }
        dict.setDictValue(childList);
        dictService.saveDict(dict);
    }

    /**
     * 判断第三方审核是否启用
     *
     * @return true：启用，false：关闭
     */
    public boolean isThirdAuditEnabled() {
        Dict dict = dictService.findDictByCode(THIRD_AUDIT_CONFIG_DICT_CODE);
        if (dict != null) {
            List<DictChild> dictValue = dict.getDictValue();
            String jsonString = JSON.toJSONString(dictValue);
            List<DictChild> childList = JSON.parseArray(jsonString, DictChild.class);
            for (DictChild dictChild : childList) {
                if (IS_OPEN.equals(dictChild.getDictCode())) {
                    return Boolean.parseBoolean(dictChild.getDictName());
                }
            }
        }
        return false;
    }

    /**
     * 获取第三方审核地址
     */
    public String getThirdAuditWebhookUrl() {
        Dict dict = dictService.findDictByCode(THIRD_AUDIT_CONFIG_DICT_CODE);
        if (dict != null) {
            List<DictChild> dictValue = dict.getDictValue();
            String jsonString = JSON.toJSONString(dictValue);
            List<DictChild> childList = JSON.parseArray(jsonString, DictChild.class);
            for (DictChild dictChild : childList) {
                if (WEBHOOK_URL.equals(dictChild.getDictCode())) {
                    return dictChild.getDictName();
                }
            }
        }
        return null;
    }

    /**
     * 提交第三方审核
     *
     * @return
     */
    public String commitThirdAudit(ThirdAuditModel thirdAuditModel) throws Exception {
        String webhookUrl = this.getThirdAuditWebhookUrl();
        if (StrUtil.isBlank(webhookUrl)) {
            throw new Exception("未配置第三方审核地址");
        }
        String url = webhookUrl + "/audit";
        return HttpUtil.post(url, JSON.toJSONString(thirdAuditModel));
    }

}