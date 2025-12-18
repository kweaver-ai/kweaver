package com.aishu.doc.monitor;

import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONException;
import aishu.cn.msq.MessageHandler;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * @description 文件夹重命名消息监听类
 * @author Liuchu
 */
@Slf4j
@Component(value = NsqConstants.CORE_FOLDER_RNNAME)
public class FolderRnameReceiver implements MessageHandler {

    @Resource
    private DocAuditApplyService docAuditApplyService;

    /**
     * @description 文件夹重命名，更新审核中文件夹名，流程不做处理
     * @author ouandyang
     * @param  handler
     * @updateTime 2021/5/13
     */
    @Override
    public void handler(String msg) {
        if (log.isDebugEnabled()) {
            log.debug("文件夹重命名消息监听类正在处理...");
        }
        if (StringUtils.isEmpty(msg)) {
			return;
		}
        try {
            JSONObject jsonObject = JSONObject.parseObject(msg);
            String id = jsonObject.getString("id");
            if (StringUtils.isEmpty(id)) {
            	return;
            }
            String newPath = jsonObject.getString("new_path");
            //文件重命名更新申请与历史申请数据
            docAuditApplyService.fileRenameManage(id, newPath);
        } catch (JSONException e) {
            log.warn("文件夹重命名消息监听处理失败, json解析失败！！msg：{}", msg, e);
        } catch (NullPointerException e) {
            log.warn("文件夹重命名消息监听处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_FOLDER_RNNAME, e, msg);
            log.warn("文件夹重命名消息监听处理失败！！msg：{}", msg, e);
            throw e;
        }finally {
		}
    }
}
