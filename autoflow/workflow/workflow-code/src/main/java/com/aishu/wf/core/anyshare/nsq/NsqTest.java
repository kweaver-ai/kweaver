package com.aishu.wf.core.anyshare.nsq;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.model.SysLogBean;
import com.aishu.wf.core.common.util.SysLogUtils;
import aishu.cn.msq.MessageHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

/**
 * @description msg test
 * @author yannan
 */
@Slf4j
@Component(value = "workflow.test")
public class NsqTest implements MessageHandler {
    @Override
    public void handler(java.lang.String msg) {
        log.info(msg);
        if (log.isDebugEnabled()) {
            log.debug("workflow测试消息...");
        }
        return;
    }

}