package com.aishu.doc.monitor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditExpReminderModel;
import com.aishu.doc.audit.model.DocAuditHistoryModel;
import com.aishu.doc.audit.service.DocAuditApplyService;
import com.aishu.doc.audit.service.DocAuditHistoryService;
import com.aishu.doc.audit.service.DocAuditReminderService;
import com.aishu.wf.core.anyshare.nsq.NsqConstants;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import com.aishu.wf.core.doc.model.DocShareStrategyConfig;
import com.aishu.wf.core.doc.service.DocShareStrategyConfigService;
import com.aishu.wf.core.engine.core.model.dto.ExpireReminderDTO;
import com.aishu.wf.core.engine.core.model.warp.ExpireReminderWarp;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONException;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;

import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import java.util.Calendar;
import java.util.Date;

@Slf4j
@Component(value = NsqConstants.EXPIRED_REMINDER)
public class ExpiredReminderReceiver implements MessageHandler{

    private static final String queryName = "expReminder";
    @Autowired
    private DocShareStrategyConfigService docShareStrategyConfigService;
    @Autowired
    private DocAuditHistoryService docAuditHistoryService;
    @Autowired
    private DocAuditApplyService docAuditApplyService;
    @Autowired
    private DocAuditReminderService docAuditReminderService;

    @Override
	public void handler(String msg) {
		if (log.isDebugEnabled()) {
			log.debug("定时提醒消息监听类正在处理...");
		}
		if (StringUtils.isEmpty(msg)) {
			return;
		}
		try {
			JSONObject jsonObject = JSONObject.parseObject(msg);
			Boolean reminder = (Boolean) jsonObject.get("reminder");
			if (!reminder) {
				return;
			}
            new Thread(()->{
                // 使用异步操作防止消费时间超时导致重复消费
                this.scheduleReminder();
            }).start();
		} catch(JSONException e) {
			log.warn("定时提醒消息监听类处理失败, json解析失败！msg：{}", msg, e);
		} catch (NullPointerException e) {
            log.warn("定时提醒消息监听类处理失败, 业务数据不存在！{message：{}}", new String(msg), e);
        } catch (Exception e) {
			SysLogUtils.insertSysLog(SysLogBean.TYPE_ERROR, NsqConstants.CORE_DOCLIB_REMOVE, e, msg);
			log.warn("定时提醒消息监听类处理失败！msg：{}", msg, e);
			throw e;
		} finally {
		}
	}
            
    private void scheduleReminder () {
        List<DocShareStrategyConfig> strategyConfigs = docShareStrategyConfigService.listDocShareStrategyConfig(queryName);
        // 获取到所有流程到期提醒配置
        Map<String, DocAuditExpReminderModel> strategyConfigMap = getStrategyConfigMap(strategyConfigs);
        
        strategyConfigMap.forEach((key, value)-> {
            // 获取当前所有申请记录
            List<DocAuditApplyModel> toReminderTasks =  docAuditApplyService.selectToReminderList(key);
            Map<String, List<String>> bizIDToAuditorsMap = toReminderTasks.stream()
            .collect(Collectors.groupingBy(DocAuditApplyModel::getBizId,
                            Collectors.mapping(DocAuditApplyModel::getAuditor, Collectors.toList())));
            for (DocAuditApplyModel toReminderTask : toReminderTasks) {
                // 未到过期时间
                if (!this.checkReminderStatus(toReminderTask.getApplyTime(),
                        Integer.valueOf(value.getExpReminderInternal()),
                        Integer.valueOf(value.getExpReminderFreq()))) {
                    continue;
                }
                // 获取当前任务详情
                DocAuditHistoryModel docAuditHistoryModel = docAuditHistoryService.getOne(
                    new LambdaQueryWrapper<DocAuditHistoryModel>().eq(DocAuditHistoryModel::getId, toReminderTask.getBizId()));
                // 发送邮件提醒
                docAuditReminderService.asynSendemail(docAuditHistoryModel, bizIDToAuditorsMap.get(toReminderTask.getBizId()), "", "", "");
            }
        });
    }

    private Map<String, DocAuditExpReminderModel> getStrategyConfigMap(List<DocShareStrategyConfig> strategyConfigs) {
        Map<String, List<DocShareStrategyConfig>> itemsById = strategyConfigs.stream().collect(Collectors.groupingBy(DocShareStrategyConfig::getProcDefId));
        Map<String, DocAuditExpReminderModel> strategyConfigMap = new HashMap<>();
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.addMixIn(ExpireReminderDTO.class, ExpireReminderWarp.class);
        
        for (String key: itemsById.keySet()) {
            List<DocShareStrategyConfig> reminderConfigs = itemsById.get(key);
            Map<String, String> reminderConfigsMap = reminderConfigs.stream().collect(Collectors.toMap(DocShareStrategyConfig::getName, DocShareStrategyConfig::getValue));
            try {
                String jsonString = objectMapper.writeValueAsString(reminderConfigsMap);
                DocAuditExpReminderModel reminderModel = JSON.parseObject(jsonString, DocAuditExpReminderModel.class);
                if (!reminderModel.getExpReminderSwitch().equals("true")) {
                    continue;
                }
                reminderModel.setProcDefID(key);
                strategyConfigMap.put(key, reminderModel);
            } catch (Exception e) {
                continue;
            }
        }
        return strategyConfigMap;
    }

    private Boolean checkReminderStatus(Date applyTime, Integer pastTime, Integer frequency) {
        Integer firstReminder = pastTime + frequency;
        // 当前时间
        Calendar reminderTime = Calendar.getInstance();
        reminderTime.set(Calendar.HOUR_OF_DAY, 10);
        reminderTime.set(Calendar.MINUTE, 0);
        reminderTime.set(Calendar.SECOND, 0);
        reminderTime.set(Calendar.MILLISECOND, 0);
 
        // 过期时间
        Calendar expiredTime = Calendar.getInstance();
        expiredTime.setTime(applyTime);
        int expiredHour = expiredTime.get(Calendar.HOUR_OF_DAY);
        if (expiredHour >= 10) {
             firstReminder++;
        }
        expiredTime.add(Calendar.DAY_OF_MONTH, firstReminder);
        expiredTime.set(Calendar.HOUR_OF_DAY, 10);
        expiredTime.set(Calendar.MINUTE, 0);
        expiredTime.set(Calendar.SECOND, 0);
        expiredTime.set(Calendar.MILLISECOND, 0);
 
        Date expiredDate = expiredTime.getTime();
        Date reminderDate = reminderTime.getTime();
        if (expiredDate.after(reminderDate)) {
            return false;
        }
 
        // 计算两个日期之间的毫秒差
        long diffInMillies = Math.abs(reminderDate.getTime() - expiredDate.getTime());
        // 转换为天数
        long diff = TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS);
        return diff == 0 || diff > 0 && diff % frequency == 0;
    }
}
