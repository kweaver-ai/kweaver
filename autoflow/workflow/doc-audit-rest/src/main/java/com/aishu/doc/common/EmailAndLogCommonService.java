package com.aishu.doc.common;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aishu.doc.email.common.EmailUtils;
import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.EfastApi;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailAndLogCommonService {
    @Autowired
    protected AnyShareConfig anyShareConfig;
    private EfastApi efastApi;

    private final static String ATTACHMENT_TEMPLATE = "审核员添加的附件：{}";

    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        efastApi = anyShareClient.getEfastApi();
    }

    private String setAttachmentNames(List<String> docIds) {
        List<String> names = new ArrayList<>();
        if (docIds == null || docIds.size() == 0) {
            return "";
        }
        try {
            JSONArray docs = efastApi.batchGetDocInfo(docIds, Arrays.asList("names"));
            for (Object doc : docs) {
                JSONObject obj = JSON.parseObject(doc.toString());
                names.add(obj.getString("name"));
            }
        } catch (Exception e) {
            log.warn("batch get doc info err, detail: {}", e.getMessage());
        }
        return String.join(",", names);
    }

    public String setAttachmentLog(List<String> docIds, String exMsg) {
        String attachmentStr = setAttachmentNames(docIds);
        if (StrUtil.isEmpty(attachmentStr)) {
            return exMsg;
        }
        exMsg = exMsg + "；" + StrUtil.format(ATTACHMENT_TEMPLATE, attachmentStr);
        return exMsg;
    }

    public void addAdditionalProperties(List<String> msgForLogList, cn.hutool.json.JSONObject contentJsonObj, 
            cn.hutool.json.JSONObject template, List<String> docIds, Boolean needShortName) {
        String attachmentStr = setAttachmentNames(docIds);
        if (StrUtil.isEmpty(attachmentStr)) {
            return;
        }
        if (needShortName) {
            attachmentStr = EmailUtils.substring(attachmentStr, 200);
        }
        msgForLogList.add("attachments");
        String language = anyShareConfig.getLanguage();
        if (language.indexOf("en_US") != -1) {
            contentJsonObj.set("attachments",StrUtil.format(template.getStr("en_US"), attachmentStr));
        } else if (language.indexOf("zh_CN") != -1) {
            contentJsonObj.set("attachments",StrUtil.format(template.getStr("zh_CN"), attachmentStr));
        }else if (language.indexOf("zh_TW") != -1) {
            contentJsonObj.set("attachments",StrUtil.format(template.getStr("zh_TW"), attachmentStr));
        }
        else {
            contentJsonObj.set("attachments",StrUtil.format(template.getStr("zh_CN"), attachmentStr));
        }
    }

    public void addAdditionalProperties(Map<String, Object> data, List<String> docIds, Boolean needShortName) {
        String attachmentStr = setAttachmentNames(docIds);
        if (StrUtil.isEmpty(attachmentStr)) {
            return;
        }
        if (needShortName) {
            attachmentStr = EmailUtils.substring(attachmentStr, 200);
        }
        data.put("attachments",  attachmentStr);
    }

    public cn.hutool.json.JSONObject getAttachmentLogMulti() {
        cn.hutool.json.JSONObject attachmentObj = new cn.hutool.json.JSONObject();
        attachmentObj.set("en_US","Attachment added by approver：{}");
        attachmentObj.set("zh_CN","审核员添加的附件：{}");
        attachmentObj.set("zh_TW","核准者新增的附件：{}");
        return attachmentObj;
    }

    public cn.hutool.json.JSONObject getAttachmentEmailMulti() {
        cn.hutool.json.JSONObject attachmentObj = new cn.hutool.json.JSONObject();
        attachmentObj.set("en_US","Attachment：{}");
        attachmentObj.set("zh_TW","簽核附件：{}");
        attachmentObj.set("zh_CN","审核附件：{}");
        return attachmentObj;
    }
}
