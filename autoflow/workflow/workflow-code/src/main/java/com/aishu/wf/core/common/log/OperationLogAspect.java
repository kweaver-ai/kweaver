package com.aishu.wf.core.common.log;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;

import com.aishu.wf.core.anyshare.client.AnyShareClient;
import com.aishu.wf.core.anyshare.client.UserManagementOperation;
import com.aishu.wf.core.anyshare.config.AnyShareConfig;
import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.anyshare.model.User;
import com.aishu.wf.core.anyshare.thrift.service.EacplogProxyService;
import com.aishu.wf.core.common.aspect.annotation.OperationLog;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.common.log.handler.LogHandler;
import com.aishu.wf.core.common.model.dto.OperationLogDTO;
import com.aishu.wf.core.common.util.ApplicationContextHolder;
import com.aishu.wf.core.common.util.OperationLogConstants;
import com.aishu.wf.core.common.util.RequestUtils;
import com.aishu.wf.core.thrift.eacplog.ncTLogLevel;
import com.aishu.wf.core.thrift.eacplog.ncTLogType;
import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @description 操作日志切面
 * @author hanj
 */
@Slf4j
@Component
@Aspect
//@ConditionalOnProperty(prefix = "ut", name = "disableAspect", havingValue = "false")
public class OperationLogAspect {

    @Resource
    private EacplogProxyService logService;

	@Autowired
	AnyShareConfig anyShareConfig;

    private UserManagementOperation userManagementOperation;

    private String USER_ADMIN = "266c6a42-6131-4d62-8f39-853e7093701c";
    
    @PostConstruct
    public void init() {
        AnyShareClient anyShareClient = new AnyShareClient(anyShareConfig);
        userManagementOperation = anyShareClient.getUserManagementOperation();
    }


    @Pointcut("@annotation(com.aishu.wf.core.common.aspect.annotation.OperationLog)")
    public void pointCut() {
    }

    @Around("pointCut()")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        MethodSignature methodSignature = (MethodSignature) point.getSignature();
        Method method = methodSignature.getMethod();
        OperationLog operationLogAnnotation = method.getAnnotation(OperationLog.class);
        String type = operationLogAnnotation.title();
        OperationLogConstants.LogLevel level = operationLogAnnotation.level();
        // 获取所有请求参数
        Object[] args = point.getArgs();
        Object result;
        boolean flag = true;
        OperationLogDTO logDTO = null;
        LogHandler handle = (LogHandler) ApplicationContextHolder.getBean(type);
        try {
            logDTO = handle.buildLog(args);
            log.info("构建操作日志对象:类型{}；对象{}", type, JSON.toJSONString(logDTO));
        } catch (RestException e) {
            log.warn("构建操作日志==={}", e.getMessage());
        } catch (Exception e) {
            log.error("构建操作日志对象数据失败！", e);
        }
        try {
            result = point.proceed();
        } catch (Throwable e) {
            flag = false;
            throw e;
        } finally {
            long start = System.currentTimeMillis();
            if (logDTO != null) {
                try {
                    String logDTOMsg = null;
                    ncTLogLevel logDTOLevel = null;
                    if(level.getValue() == OperationLogConstants.LogLevel.NCT_LL_NULL.getValue()){
                        logDTOMsg = logDTO.getMsg() + (flag ? "成功" : "失败");
                        logDTOLevel = flag ? ncTLogLevel.NCT_LL_INFO : ncTLogLevel.NCT_LL_WARN;
                    } else {
                        logDTOMsg = logDTO.getMsg();
                        logDTOLevel = ncTLogLevel.findByValue(level.getValue());
                    }
                    if(!StringUtils.isEmpty(logDTOMsg)) {
                    	logDTO.setMsg(logDTOMsg);
                    	if(null == logDTO.getLevel()){
                            logDTO.setLevel(logDTOLevel);
                        }
                    	this.saveOperationLog(logDTO);
                    }
                } catch (Exception e) {
                    log.error("保存操作日志失败！", e);
                } finally {
                    log.info("保存操作日志耗时：{} 毫秒", System.currentTimeMillis() - start);
                }
            }
        }
        return result;
    }

    /**
     * 调用thrift服务保存日志
     *
     * @param sysLog
     */
    private void saveOperationLog(OperationLogDTO sysLog) {
        String userId = RequestUtils.getUserId();
        HttpServletRequest request = RequestUtils.getRequest();
        if (request != null) {
            String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
            sysLog.setUserAgent(userAgent);
            String ip = RequestUtils.getIpAddress(request);
            sysLog.setIp(ip);
        }
        if(StrUtil.isBlank(sysLog.getUserId())){
            sysLog.setUserId(userId);
        }
        
        if (!sysLog.getUserId().equals(USER_ADMIN)){
            try {
                User userInfo = userManagementOperation.getUserInfoById(sysLog.getUserId());
                sysLog.setUserName(userInfo.getName());
                String deps = "";
                for (List<Department> parentDeps : userInfo.getParent_deps()) {
                    String dep = parentDeps.stream().map(Department::getName).collect(Collectors.joining(", "));
                    deps = String.join(",", deps, dep);
                }
                sysLog.setParentDeps(deps.replaceAll("^[,]+|[,]+$", ""));
            } catch (Exception e) {
                sysLog.setUserName(userId);
                sysLog.setParentDeps("未分配组");
                log.error("保存操作日志，获取用户信息失败！", e);
            }
        }
        sysLog.setObjId("");
        sysLog.setAdditionInfo("");
        sysLog.setDate(System.currentTimeMillis() * 1000);
        sysLog.setMac("");
        // 外部绑定的业务id，防止nsq消费重复添加限制，无实际意义
        sysLog.setOutBizId(IdUtil.randomUUID());
        sysLog.setUserType("authenticated_user");
        log.info("调用nsq服务保存日志:{}", JSON.toJSONString(sysLog));
        logService.saveEacpLog(sysLog);
    }


}
