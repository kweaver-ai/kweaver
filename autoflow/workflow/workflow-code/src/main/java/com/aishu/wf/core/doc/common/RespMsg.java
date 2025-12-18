package com.aishu.wf.core.doc.common;

/**
 * @Description 异常返回信息
 * @Author crzep
 * @Date 2021/4/12 11:12
 * @VERSION 1.0
 **/
public class RespMsg {

    private RespMsg(){
        throw new IllegalArgumentException("can't instance...");
    }

    /**
     * 不可控意外，需要重试
     */
    public static final String WORKFLOW_FREE_AUDIT_OPERATION_FAIL="操作失败，请重试！";
    public static final String WORKFLOW_FREE_AUDIT_OPERATION_FAIL_CODE="100001";

    /**
     * 密级参数错误
     */
    public static final String WORKFLOW_FREE_AUDIT_LEVEL_ILLEGALARGUMENT = "操作失败，传入密级参数“%s”不合法！";
    public static final String WORKFLOW_FREE_AUDIT_LEVEL_ILLEGALARGUMENT_CODE = "100002";

    /**
     * 字典参数错误
     */
    public static final String WORKFLOW_FREE_AUDIT_DICT_NOT_FOUND="操作失败，字段“%s”未找到!";
    public static final String WORKFLOW_FREE_AUDIT_DICT_NOT_FOUND_CODE="100003";

}