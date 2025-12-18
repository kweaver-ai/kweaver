package com.aishu.wf.core.engine.config.service;

import cn.hutool.core.util.StrUtil;
import com.aishu.wf.core.common.util.CommonConstants;
import com.aishu.wf.core.doc.model.DocShareStrategy;
import com.aishu.wf.core.doc.model.dto.DocShareStrategyDTO;
import com.aishu.wf.core.engine.config.dao.DictDao;
import com.aishu.wf.core.engine.config.model.Dict;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * @description 字典服务
 * @author ouandyang
 */
@Service
public class DictService extends ServiceImpl<DictDao, Dict> {

    /**
     * @description 保存字典
     * @author ouandyang
     * @param  dict
     * @updateTime 2021/5/19
     */
    public boolean saveDict(Dict dict) {
        if (dict == null) {
            return false;
        }
        if (StrUtil.isNotBlank(dict.getId())) {
            return this.updateById(dict);
        } else {
            return this.save(dict);
        }
    }

    /**
     * @description 根据字典CODE查询字典
     * @author ouandyang
     * @param  code
     * @updateTime 2021/5/19
     */
    public Dict findDictByCode(String code) {
        return this.getOne(new LambdaQueryWrapper<Dict>().eq(Dict::getDictCode, code));
    }

    /**
     * @description 保存自动审核开关配置
     * @author hanj
     * @param status
     * @updateTime 2021/6/7
     */
    public void saveAutoAuditSwitch(String code, String status) {
        Dict exitSwitch = this.findDictByCode(code);
        if(null == exitSwitch){
            Dict auditSwitch = new Dict();
            auditSwitch.setDictName(status);
            auditSwitch.setDictCode(code);
            auditSwitch.setStatus("y");
            auditSwitch.setAppId(CommonConstants.TENANT_AS_WORKFLOW);
            this.saveDict(auditSwitch);
        } else {
            exitSwitch.setDictName(status);
            this.updateById(exitSwitch);
        }
    }

    /**
     * @description 保存共享加签策略
     * @author hanj
     * @param docShareStrategyDTO docShareStrategyDTO
     * @param processDefKey processDefKey
     * @updateTime 2023/1/13
     */
    public void saveShareCountersignStrategy(DocShareStrategyDTO docShareStrategyDTO, String processDefKey) {
        List<String> countersignKeyList = new ArrayList<>();
        if(processDefKey.equals(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY)){
            countersignKeyList.add(WorkFlowContants.RENAME_COUNTERSIGN_SWITCH);
            countersignKeyList.add(WorkFlowContants.RENAME_COUNTERSIGN_COUNT);
            countersignKeyList.add(WorkFlowContants.RENAME_COUNTERSIGN_AUDITORS);
        } else if(processDefKey.equals(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)){
            countersignKeyList.add(WorkFlowContants.ANONYMITY_COUNTERSIGN_SWITCH);
            countersignKeyList.add(WorkFlowContants.ANONYMITY_COUNTERSIGN_COUNT);
            countersignKeyList.add(WorkFlowContants.ANONYMITY_COUNTERSIGN_AUDITORS);
        }
        if(countersignKeyList.size() > 0){
            for(String countersignKey : countersignKeyList){
                Dict exitDict = this.findDictByCode(countersignKey);
                String dictName = "";
                if(WorkFlowContants.RENAME_COUNTERSIGN_SWITCH.equals(countersignKey) ||
                        WorkFlowContants.ANONYMITY_COUNTERSIGN_SWITCH.equals(countersignKey)){
                    dictName = docShareStrategyDTO.getCountersign_switch();
                } else if(WorkFlowContants.RENAME_COUNTERSIGN_COUNT.equals(countersignKey) ||
                        WorkFlowContants.ANONYMITY_COUNTERSIGN_COUNT.equals(countersignKey)){
                    dictName = docShareStrategyDTO.getCountersign_count();
                } else if(WorkFlowContants.RENAME_COUNTERSIGN_AUDITORS.equals(countersignKey) ||
                        WorkFlowContants.ANONYMITY_COUNTERSIGN_AUDITORS.equals(countersignKey)){
                    dictName = docShareStrategyDTO.getCountersign_auditors();
                }
                if(null == exitDict){
                    Dict countersignDict = new Dict();
                    countersignDict.setDictName(dictName);
                    countersignDict.setDictCode(countersignKey);
                    countersignDict.setStatus("Y");
                    countersignDict.setAppId(CommonConstants.TENANT_AS_WORKFLOW);
                    this.saveDict(countersignDict);
                } else {
                    exitDict.setDictName(dictName);
                    this.updateById(exitDict);
                }
            }
        }
    }

    public DocShareStrategy getShareCountersignStrategy(String processDefKey){
        List<String> countersignKeyList = new ArrayList<>();
        if(processDefKey.equals(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY)){
            countersignKeyList.add(WorkFlowContants.RENAME_COUNTERSIGN_SWITCH);
            countersignKeyList.add(WorkFlowContants.RENAME_COUNTERSIGN_COUNT);
            countersignKeyList.add(WorkFlowContants.RENAME_COUNTERSIGN_AUDITORS);
        } else if(processDefKey.equals(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)){
            countersignKeyList.add(WorkFlowContants.ANONYMITY_COUNTERSIGN_SWITCH);
            countersignKeyList.add(WorkFlowContants.ANONYMITY_COUNTERSIGN_COUNT);
            countersignKeyList.add(WorkFlowContants.ANONYMITY_COUNTERSIGN_AUDITORS);
        }
        DocShareStrategy result = new DocShareStrategy();
        if(countersignKeyList.size() > 0){
            for(String countersignKey : countersignKeyList){
                Dict exitDict = this.findDictByCode(countersignKey);
                if(WorkFlowContants.RENAME_COUNTERSIGN_SWITCH.equals(countersignKey) ||
                        WorkFlowContants.ANONYMITY_COUNTERSIGN_SWITCH.equals(countersignKey)){
                    result.setCountersignSwitch(null != exitDict ? exitDict.getDictName() : "N");
                } else if(WorkFlowContants.RENAME_COUNTERSIGN_COUNT.equals(countersignKey) ||
                        WorkFlowContants.ANONYMITY_COUNTERSIGN_COUNT.equals(countersignKey)){
                    result.setCountersignCount(null != exitDict ? exitDict.getDictName() : "1");
                } else if(WorkFlowContants.RENAME_COUNTERSIGN_AUDITORS.equals(countersignKey) ||
                        WorkFlowContants.ANONYMITY_COUNTERSIGN_AUDITORS.equals(countersignKey)){
                    result.setCountersignAuditors(null != exitDict ? exitDict.getDictName() : "1");
                }
            }
        }
        return result;
    }

    /**
     * @description 保存高级设置策略
     * @author siyu.chen
     * @param docShareStrategyDTO docShareStrategyDTO
     * @param processDefKey processDefKey
     * @updateTime 2023/7/25
     */
    public void saveShareAdvancedConfigStrategy(DocShareStrategyDTO docShareStrategyDTO, String processDefKey) {
        List<String> advancedConfigKeyList = new ArrayList<>();
        if(processDefKey.equals(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY)){
            advancedConfigKeyList.add(WorkFlowContants.RENAME_TRANSFER_SWITCH);
            advancedConfigKeyList.add(WorkFlowContants.RENAME_TRANSFER_COUNT);
        } else if(processDefKey.equals(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)){
            advancedConfigKeyList.add(WorkFlowContants.ANONYMITY_TRANSFER_SWITCH);
            advancedConfigKeyList.add(WorkFlowContants.ANONYMITY_TRANSFER_COUNT);
        }
        if(advancedConfigKeyList.size() > 0){
            for(String advancedConfigKey : advancedConfigKeyList){
                Dict exitDict = this.findDictByCode(advancedConfigKey);
                String dictName = "";
                if(WorkFlowContants.RENAME_TRANSFER_SWITCH.equals(advancedConfigKey) ||
                        WorkFlowContants.ANONYMITY_TRANSFER_SWITCH.equals(advancedConfigKey)){
                    dictName = docShareStrategyDTO.getTransfer_switch();
                } else if(WorkFlowContants.RENAME_TRANSFER_COUNT.equals(advancedConfigKey) ||
                        WorkFlowContants.ANONYMITY_TRANSFER_COUNT.equals(advancedConfigKey)){
                    dictName = docShareStrategyDTO.getTransfer_count();
                }
                if(null == exitDict){
                    Dict transferDict = new Dict();
                    transferDict.setDictName(dictName);
                    transferDict.setDictCode(advancedConfigKey);
                    transferDict.setStatus("Y");
                    transferDict.setAppId(CommonConstants.TENANT_AS_WORKFLOW);
                    this.saveDict(transferDict);
                } else {
                    exitDict.setDictName(dictName);
                    this.updateById(exitDict);
                }
            }
        }
    }

    public DocShareStrategy getShareAdvancedConfigStrategy(String processDefKey){
        List<String> advancedConfigKeyList = new ArrayList<>();
        if(processDefKey.equals(WorkFlowContants.RENAME_SHARE_PROC_DEF_KEY)){
            advancedConfigKeyList.add(WorkFlowContants.RENAME_TRANSFER_SWITCH);
            advancedConfigKeyList.add(WorkFlowContants.RENAME_TRANSFER_COUNT);
        } else if(processDefKey.equals(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)){
            advancedConfigKeyList.add(WorkFlowContants.ANONYMITY_TRANSFER_SWITCH);
            advancedConfigKeyList.add(WorkFlowContants.ANONYMITY_TRANSFER_COUNT);
        }

        DocShareStrategy result = new DocShareStrategy();
        if(advancedConfigKeyList.size() > 0){
            for(String advancedConfigKey : advancedConfigKeyList){
                Dict exitDict = this.findDictByCode(advancedConfigKey);
                if(WorkFlowContants.RENAME_TRANSFER_SWITCH.equals(advancedConfigKey) ||
                        WorkFlowContants.ANONYMITY_TRANSFER_SWITCH.equals(advancedConfigKey)){
                    result.setTransferSwitch(null != exitDict ? exitDict.getDictName() : "N");
                } else if(WorkFlowContants.RENAME_TRANSFER_COUNT.equals(advancedConfigKey) ||
                        WorkFlowContants.ANONYMITY_TRANSFER_COUNT.equals(advancedConfigKey)){
                    result.setTransferCount(null != exitDict ? exitDict.getDictName() : "1");
                }
            }
        }
        return result;
    }
}
