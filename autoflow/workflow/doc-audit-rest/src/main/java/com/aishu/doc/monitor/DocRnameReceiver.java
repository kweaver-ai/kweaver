package com.aishu.doc.monitor;

import javax.annotation.Resource;

import com.aishu.wf.core.doc.common.DocConstants;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONException;
import aishu.cn.msq.MessageHandler;

import lombok.extern.slf4j.Slf4j;

/**
 * @description 文件重命名消息监听类
 * @author hanj
 */
@Slf4j
@Component(value = NsqConstants.CORE_FILE_RNNAME)
public class DocRnameReceiver implements MessageHandler {

    @Resource
    private DocAuditApplyService docAuditApplyService;

    /**
     * @description 文件重命名，修改申请相关所有数据，流程不做任何处理
     * @author hanj
     * @param handler handler
     * @updateTime 2021/6/21
     */
    @Override
    public void handler(String msg) {
        if (log.isDebugEnabled()) {
            log.debug("文件重命名消息监听类正在处理...");
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
            docAuditApplyService.fileRenameManage(id, DocConstants.DOC_PATH_PREFIX + newPath);
        } catch(JSONException e) {
            log.warn("文件重命名消息监听类处理失败, json解析失败！msg：{}", msg, e);
        } catch (NullPointerException e) {
            log.warn("文件重命名消息监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
            SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_FILE_RNNAME, e, msg);
            log.warn("文件重命名消息监听类处理失败！msg：{}", msg, e);
            throw e;
        }finally {
		}
    }
}
