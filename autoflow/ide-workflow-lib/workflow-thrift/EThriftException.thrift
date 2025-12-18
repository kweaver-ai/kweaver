/*********************************************************************************
EThriftException.thrift:
    统一的异常定义Thrift文件	
    Copyright (c) Eisoo Software, Inc.(2012 - ), All rights reserved.

Purpose:
    此文件定义统一的异常。
    用法在需要的thrift文件中加上 include “EThriftException.thrift” （注意没有“#”）
		文件中需要用到的地方使用  throws (1: EThriftException.ncTException exp)
		server端：根据判断在需要抛异常(针对接口而不是针对server端本身)的地方 
		          ncTException exp;
		          exp.ncTExpType = FATAL;
		          exp.codeLine = 55;
		          ...
		          throw exp;

Author:
    Chen Hao(chen.hao01@eisoo.com)
	
Creating Time:
    2012.5.7
*********************************************************************************/
namespace java com.aishu.wf.core.thrift.exception
/**
 *  异常类型枚举类型
 */
enum ncTExpType {
   NCT_FATAL = 0,          /*致命错误，处理方式为重启或退出服务*/
   NCT_CRITICAL = 1,       /*严重错误*/
   NCT_WARN  = 2,          /*警告*/
   NCT_INFO  = 3           /*提示*/
}

/**
 *  异常具体内容
 */
exception ncTException {
    1: required ncTExpType expType,     /*异常类型*/
    2: required i32     codeLine,       /*异常位置*/
    3: required i32     errID,          /*异常ID*/
    4: required string  fileName,       /*异常产生的文件名*/
    5: required string  expMsg,         /*异常具体内容*/
    6: required string  errProvider,    /*异常的提供者*/
    7: required string  time,           /*异常产生的时间*/
    8: required string  errDetail       /*用来补充异常信息*/
}
