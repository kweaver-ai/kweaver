/***************************************************************************************************
EACP.thrift:
    Copyright (c) Eisoo Software, Inc.(2009 - 2013), All rights reserved

Purpose:
    定义了 EACP Log 对外开放的 thrift 服务接口

Author:
    zou.yongbo@eisoo.com

Creating Time:
    2014-08-01
***************************************************************************************************/
include "EThriftException.thrift"
include "EVFS.thrift"

namespace cpp EACPLog
namespace py EACPLog
namespace java com.aishu.wf.core.thrift.eacplog

// 服务端口号
const i32 NC_T_EACP_LOG_PORT = 9993;

// 日志类型
enum ncTLogType {
    NCT_LT_LOGIN = 10,       // 登录日志
    NCT_LT_MANAGEMENT = 11,       // 管理日志
    NCT_LT_OPEARTION = 12        // 操作日志
}

// 日志级别
enum ncTLogLevel {
    NCT_LL_ALL = 0,    // 所有日志级别
    NCT_LL_INFO = 1,   // 信息
    NCT_LL_WARN = 2,   // 警告
}

// 登录日志类型
// 注意：如果要增加新的操作类型，一定要修改对应的文件
// platform/AnyShare/ShareServer/src/acsprocessor/config/opType2Str.csv
// 并增加platform/AnyShare/ShareServer/src/acsprocessor对应的资源文件
// 不然导出日志时，会出现未知的日志类型
enum ncTLoginType {
    NCT_CLT_ALL = 0,        // 所有操作

    NCT_CLT_LOGIN_IN = 1,      // 登录操作
    NCT_CLT_LOGIN_OUT = 2,      // 登出操作
    NCT_CLT_AUTHENICATION = 3,  // 认证操作

    NCT_CLT_OTHER = 127,    // 其它操作
}

// 管理日志类型
// 注意：如果要增加新的操作类型，一定要修改对应的文件
// platform/AnyShare/ShareServer/src/acsprocessor/config/opType2Str.csv
// 并增加platform/AnyShare/ShareServer/src/acsprocessor对应的资源文件
// 不然导出日志时，会出现未知的日志类型
enum ncTManagementType {
    NCT_MNT_ALL = 0,        // 所有操作

    NCT_MNT_CREATE = 1,                 // 新建
    NCT_MNT_ADD = 2,                    // 添加（比如域控信息）
    NCT_MNT_SET = 3,                    // 设置
    NCT_MNT_DELETE = 4,                 // 删除
    NCT_MNT_COPY = 5,                   // 复制
    NCT_MNT_MOVE = 6,                   // 移动
    NCT_MNT_REMOVE = 7,                 // 移除
    NCT_MNT_IMPORT = 8,                 // 导入
    NCT_MNT_EXPORT = 9,                 // 导出
    NCT_MNT_AUDIT_MGM = 10,             // 审核管理
    NCT_MNT_QUARANTINE = 11,            // 隔离
    NCT_MNT_UPLOAD = 12,                // 上传
    NCT_MNT_PREVIEW = 13,               // 预览
    NCT_MNT_DOWNLOAD = 14,              // 下载
    NCT_MNT_RESTORE = 15,               // 还原
    NCT_MNT_QUARANTINE_APPEAL = 16,     // 隔离区申诉
    NCT_MNT_RESTART = 17,               // 重启
    NCT_MNT_SEND_EMAIL = 18,            // 发送邮件
    NCT_MNT_RECOVER = 19,               // 恢复

    NCT_MNT_OTHER = 127,                // 其他操作
}

// 操作日志类型
// 注意：如果要增加新的操作类型，一定要修改对应的文件
// platform/AnyShare/ShareServer/src/acsprocessor/config/opType2Str.csv
// 并增加platform/AnyShare/ShareServer/src/acsprocessor对应的资源文件
// 不然导出日志时，会出现未知的日志类型
enum ncTDocOperType {
    NCT_DOT_ALL = 0,            // 所有操作

    NCT_DOT_PREVIEW = 1,        // 预览
    NCT_DOT_UPLOAD = 2,         // 上传
    NCT_DOT_DOWNLOAD = 3,       // 下载
    NCT_DOT_EDIT = 4,           // 修改
    NCT_DOT_RENAME = 5,         // 重命名
    NCT_DOT_DELETE = 6,         // 删除
    NCT_DOT_COPY = 7,           // 复制
    NCT_DOT_MOVE = 8,           // 移动
    NCT_DOT_REC_RESTORE = 9,    // 从回收站还原
    NCT_DOT_REC_DELETE = 10,    // 从回收站删除
    NCT_DOT_RESTORE_REV = 50,   // 还原版本

    NCT_DOT_PERM_MGM = 11,      // 权限共享
    NCT_DOT_OLINK_SHARE = 12,   // 外链共享
    NCT_DOT_FINDER_MGM = 13,    // 发现共享
    NCT_DOT_BACKUP_TASK = 14,	// 备份恢复
    NCT_DOT_LOCK_MGM = 16,      // 文件锁
    NCT_DOT_ENTRY_DOC_MGM = 17, // 共享管理
    NCT_DOT_DEVICE_MGM = 18,    // 登录设备管理
    NCT_DOT_SET = 19,           // 设置
    NCT_DOT_SYSREC_DELETE = 20, // 永久删除
    NCT_DOT_SYSREC_REC_RESTORE = 21,    // 从系统回收站还原
    NCT_DOT_CREATE = 22         // 新建
    NCT_DOT_DOCFLOW_SUBMIT = 23   // 提交文档流转
    NCT_DOT_AUDIT_MGM = 24      // 审核管理
    NCT_DOT_DOCFLOW = 25        // 文档流转
    NCT_DOT_FILECOLLECTOR = 26        // 文档收集
    NCT_DOT_CACHE = 27,      // 缓存
    NCT_DOT_AUTOMATION = 28, // 自动化
    NCT_DOT_EXPORT = 29, // 导出
    NCT_DOT_DOC_DOMAIN_SYNC = 30 //文档域同步

    NCT_DOT_OTHER = 127,     // 其它
}

// 日志记录
struct ncTLogItem {
    1: string userId;           // 用户id

    2: ncTLogType logType;      // 日志类别，非法的值，该日志会被丢弃掉
    3: ncTLogLevel level;       // 日志级别，非法的值会被纠正为NCT_LL_INFO
    4: i32 opType;              // 操作类型，小于0或者大于127会被纠正为127
    5: i64 date;                // 日期，since Epoch, 1970-01-01 00:00:00 +0000 (UTC) 至今的微秒数（10^-6秒）参见gettimeofday, tv.tv_sec * 1000000 + tv.tv_usec
    6: string ip;               // 来源ip
    7: string mac;              // mac地址

    8: string msg;              // 内容
    9: string exMsg;            // 附加信息
    10: string userAgent;       // 用户终端类型
    11: string objId;           // 对象id
    12: string additionalInfo;      // 附加信息
}

// 日志信息
struct ncTLogInfo {
    1: string userId;           // 用户id
    2: string userName;         // 用户名称
    3: string objId;            // 对象id

    4: ncTLogType logType;      // 日志类别
    5: ncTLogLevel level;       // 日志级别
    6: i32 opType;              // 操作类型
    7: i64 date;                // 日期

    8: string ip;               // 来源ip
    9: string mac;             // mac
    10: string msg;             // 内容
    11: string exMsg;           // 附加信息
}

/*
 * startDate: 起始日期，-1表示不限制，其它负值非法
 * endDate:截止日期：-1表示不限制，其它负值非法
 * 例如：[-1，2014-08-06]表示2014-08-06前的所有日志
 * [2014-08-05，2014-08-06]表示2014-08-05当天的所有日志
 * [2014-08-05，-1]表示2014-08-05当天及以后的所有日志
 *
 * start：起始日志号，>= 0
 * limit：取的日志条数，与start实现日志分页，-1表示不限制，其它负数值非法
 *      例如[0,-1]表示取所有的日志
 *      [0, 5] 表示取前5条日志
 *      [5, -1] 表示从第5条开始，后面所有的日志
 */
// 获取日志数量参数
struct ncTGetLogCountParam {
    1: string userId;           // 用户id
    2: ncTLogType logType;      // 日志类别
    3: i64 startDate;           // 起始日期
    4: i64 endDate;             // 截止日期
    5: list<ncTLogLevel> levels;       // 日志级别，支持选择多个，精确匹配
    6: list<i32> opTypes;       // 操作类型，支持选择多个，精确匹配
    7: list<string> displayNames;      // 显示名称，支持选择多个，精确匹配
    8: list<string> ips;         // 来源ip，支持选择多个，精确匹配
    9: list<string> macs;       // mac，支持选择多个，精确匹配
    10: list<string> msgs;        // 内容，支持选择多个，模糊匹配
    11: list<string> exMsgs;      // 附加信息，支持选择多个，模糊匹配
}

// 日志数量信息
struct ncTLogCountInfo {
    1: i64 logCount;           // 日志数量
    2: i64 maxLogId;           // 最大的logId
}

// 分页获取日志数量参数
struct ncTGetPageLogParam {
    1: string userId;           // 用户id
    2: ncTLogType logType;      // 日志类别
    3: i64 startDate;           // 起始日期
    4: i64 endDate;             // 截止日期
    5: list<ncTLogLevel> levels;       // 日志级别，支持选择多个，精确匹配
    6: list<i32> opTypes;       // 操作类型，支持选择多个，精确匹配
    7: list<string> displayNames;      // 显示名称，支持选择多个，精确匹配
    8: list<string> ips;         // 来源ip，支持选择多个，精确匹配
    9: list<string> macs;       // mac，支持选择多个，精确匹配
    10: list<string> msgs;        // 内容，支持选择多个，模糊匹配
    11: list<string> exMsgs;      // 附加信息，支持选择多个，模糊匹配
    12: i32 start;              // 开始日志号
    13: i32 limit;              // 条数
    14: i64 maxLogId;           // 最大的logId
}

// 获取历史日志文件数量参数
struct ncTGetHistoryLogCountParam {
    1: ncTLogType logType;      // 日志类别
    2: list<string> names;       // 文件名，支持选择多个，模糊匹配
}

// 分页获取历史日志信息参数
struct ncTGetPageHistoryLogParam {
    1: ncTLogType logType;      // 日志类别
    2: list<string> names;       // 文件名，支持选择多个，模糊匹配
    3: i32 start;              // 开始历史日志文件数
    4: i32 limit;              // 条数
}

// 导出日志参数
struct ncTExportLogParam {
    1: string userId;           // 用户id
    2: ncTLogType logType;      // 日志类别
    3: i64 startDate;           // 起始日期
    4: i64 endDate;             // 截止日期
    5: list<ncTLogLevel> levels;       // 日志级别，支持选择多个，精确匹配
    6: list<i32> opTypes;       // 操作类型，支持选择多个，精确匹配
    7: list<string> displayNames;      // 显示名称，支持选择多个，精确匹配
    8: list<string> ips;         // 来源ip，支持选择多个，精确匹配
    9: list<string> macs;       // mac，支持选择多个，精确匹配
    10: list<string> msgs;        // 内容，支持选择多个，模糊匹配
    11: list<string> exMsgs;      // 附加信息，支持选择多个，模糊匹配
    12: i32 start;              // 开始日志号
    13: i32 limit;              // 条数
    14: i64 maxLogId;           // 最大的logId
}

// 历史日志信息
struct ncTHistoryLogInfo {
    1: string name;         // 日志文件名称
    2: string id;           // 日志文件id
    3: i64 size;            // 日志文件大小
    4: i64 dumpDate;        // 转存日期
}

// 日志占用信息
struct ncTLogSpaceInfo {
    1: i64 totalSize;       // 日志可用总空间
    2: i64 usedSize;        // 已占用空间
}

// EACP Thrift Log Service
service ncTEACPLog {
    /**
     * 记录日志
     */
    oneway void Log (1: ncTLogItem item);

    /**
     * 获取日志的条数
     */
    ncTLogCountInfo GetLogCount (1: ncTGetLogCountParam param)
        throws (1: EThriftException.ncTException exp);

    /**
     * 分页获取日志
     * 返回的结果默认按时间降序
     */
    list<ncTLogInfo> GetPageLog (1: ncTGetPageLogParam param)
        throws (1: EThriftException.ncTException exp);

    /**
     * 分块导出日志
     * 返回分块数据
     */
    string ExportLog (1: ncTExportLogParam param)
        throws (1: EThriftException.ncTException exp);

    /**
     * 设置日志保留周期 (单位：月)
     */
    void SetLogRetentionPeriod (1: i32 period)
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取日志保留周期 (单位：月)
     */
     i32 GetLogRetentionPeriod ()
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取某个日志类型的所有日志
     */
    list<ncTHistoryLogInfo> GetHistoryLogs (1: ncTLogType logType)
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取历史日志文件的总数
     */
    i64 GetHistoryLogCount (1: ncTGetHistoryLogCountParam param)
        throws (1: EThriftException.ncTException exp);

    /**
     * 分页获取历史日志文件信息
     * 返回的结果默认按时间降序
     */
    list<ncTHistoryLogInfo> GetPageHistoryLog (1: ncTGetPageHistoryLogParam param)
        throws (1: EThriftException.ncTException exp);

   /**
     * 获取历史日志文件下载信息
     *
     * @param id: 历史日志文件id
     * @param reqHost: 从存储服务下载的请求地址
     * @param useHttps: 是否使用https下载
     * @param validSeconds: 下载请求的有效时长
     * @return : 下载请求的method, url, headers
     * @throw 转抛内部调用异常
     *        若id不存在
     */
    EVFS.ncTEVFSOSSRequest GetHistoryLogDownLoadInfo (1: string id,
                                       2: string reqHost,
                                       3: bool useHttps,
                                       4: i64 validSeconds)
                                       throws (1: EThriftException.ncTException exp);

    /**
     * 读取历史日志文件内容
     * @param fileId        文档id
     * @param offset        读取开始偏移位置
     * @param length        读取大小
     * @return              返回日志文件内容的二进制流字符串
     */
    string ReadHistoryLog (1: string fileId, 2: i64 offset, 3: i32 length)
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取日志占用的空间
     * @return              返回日志占用信息
     */
    ncTLogSpaceInfo GetLogSpaceInfo ()
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取缓冲区的日志信息
     * @return              返回日志信息
     */
    list<ncTLogInfo> GetBufferedLogs ()
        throws (1: EThriftException.ncTException exp);

    /**
     * 设置syslog首次推送时间
    */
    void SetSyslogFirstPushTime (1: i64 time)
        throws (1: EThriftException.ncTException exp);

    /**
     * 设置日志推送周期 (单位：分钟)
     */
    void SetLogPushPeriod (1: i32 period)
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取日志推送周期 (单位：分钟)
     */
    i32 GetLogPushPeriod ()
        throws (1: EThriftException.ncTException exp);

    /**
     * 日志涉密配置
     */
    void SetSecretConfig (1: string key, 2: bool value)
        throws (1: EThriftException.ncTException exp);

    /**
     * 获取日志涉密配置
     */
    bool GetSecretConfig (1: string key)
        throws (1: EThriftException.ncTException exp);
}
