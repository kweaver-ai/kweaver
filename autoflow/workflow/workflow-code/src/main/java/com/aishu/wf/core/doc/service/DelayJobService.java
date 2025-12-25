package com.aishu.wf.core.doc.service;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.anyshare.nsq.NsqSenderService;
import com.aishu.wf.core.common.util.ApplicationContextHolder;

import cn.hutool.json.JSONObject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DelayJobService implements Job {
    private NsqSenderService nsqSenderService;

    @Override
    public void execute(JobExecutionContext arg0) throws JobExecutionException {
        this.scheduleReminder();
    }
            
    private void scheduleReminder () {
        JSONObject obj = new JSONObject();
        obj.set("reminder", true);
        nsqSenderService = ApplicationContextHolder.getBean("NsqSenderService", NsqSenderService.class);
        nsqSenderService.sendMessage(NsqConstants.EXPIRED_REMINDER, obj.toString());
    }

}
