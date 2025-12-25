package com.aishu.wf.api.listener;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.engine.core.model.ProcessDefinitionModel;
import com.aishu.wf.core.engine.core.service.ProcessDefinitionService;
import org.activiti.engine.delegate.event.ActivitiEvent;
import org.activiti.engine.delegate.event.BaseEntityEventListener;
import org.activiti.engine.delegate.event.impl.ActivitiEntityEventImpl;
import org.activiti.engine.impl.identity.Authentication;

import java.util.List;
import java.util.Map;

/**
 * @description 流程定义删除事件监听
 * @author zhangtao
 */
public class ProcessDefinitionDeleteEventListener extends BaseEntityEventListener {
    @Override
    public void onDelete(ActivitiEvent event) {
        Object entity = ((ActivitiEntityEventImpl) event).getEntity();
        Map<String, Object> map = BeanUtil.beanToMap(entity);
        // 获取流程定义KEY
        String key = map.getOrDefault("key", "").toString();
        if(StrUtil.isBlank(key)){
            return;
        }
        ProcessDefinitionService processDefinitionService = (ProcessDefinitionService) ApplicationContextHolder.getBean("processDefinitionServiceImpl");
        List<ProcessDefinitionModel> allVersionProcessDefs = processDefinitionService.findAllVersionProcessDefs(key);
        // 如果不是最后一个版本则不管
        if(allVersionProcessDefs.size()>1){
            return;
        }
        String procDefName = map.getOrDefault("name", "").toString();
        String userId = Authentication.getAuthenticatedUserId();
        long date = System.currentTimeMillis();
        // 发送nsq消息
        NsqSenderService nsqSenderService = (NsqSenderService) ApplicationContextHolder
                .getBean("NsqSenderService");
        // 组装消息
        JSONObject json = JSONUtil.createObj()
                .set("proc_def_key", key)
                .set("proc_def_name", procDefName)
                .set("user_id", userId)
                .set("date", date);
        nsqSenderService.sendMessage(NsqConstants.WORKFLOW_SYNC_PROCESS_DELETE, json);
    }

    @Override
    public boolean isFailOnException() {
        return true;
    }
}
