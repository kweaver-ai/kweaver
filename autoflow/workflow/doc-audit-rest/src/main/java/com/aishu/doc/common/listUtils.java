package com.aishu.doc.common;

import cn.hutool.core.util.ArrayUtil;

import java.util.ArrayList;
import java.util.List;

/**
 * @program: workflow
 * @description: 数组操作工具
 * @author: xiashenghui
 * @create: 2022-04-18 16:38
 **/
public class   listUtils {

    public static String  toString(List<String> auditorIds){
      return  ArrayUtil.toString(auditorIds).replaceAll(", ",",").replace("[","").replace("]","");
    };

}
