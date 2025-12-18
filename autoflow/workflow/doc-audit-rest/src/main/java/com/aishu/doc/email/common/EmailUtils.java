package com.aishu.doc.email.common;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.common.DocSharePermEnum;

import java.util.ArrayList;
import java.util.List;

/**
 * 文档工具
 * @author ouandyang
 * @date 2021年4月20日10:56:42
 */
public class EmailUtils {

    /**
     * @description 邮件-文档名称截取字符串
     * @author ouandyang
     * @param  str 字符串
     * @param  num 截取第几个字符（汉字占2个字符）
     * @updateTime 2021/7/23
     */
    public static String substring(String str, int num) {
        String chinese = "[\u4e00-\u9fa5]";
        for (int i = 0; i < str.length(); i++) {
            String temp = str.substring(i, i + 1);
            if (num < 1 || (num < 2 && temp.matches(chinese))) {
                return str.substring(0, i) + "...";
            }
            num -= temp.matches(chinese) ? 2 : 1;
        }
        return str;
    }

//    public static void main(String[] args) {
//        String str1 = "测AB1.txt";
//        System.out.println("===" + substring(str1, 1));
//        System.out.println("===" + substring(str1, 2));
//        System.out.println("===" + substring(str1, 3));
//        System.out.println("===" + substring(str1, 4));
//        System.out.println("===" + substring(str1, 5));
//        System.out.println("===" + substring(str1, 6));
//        System.out.println("===" + substring(str1, 7));
//        System.out.println("===" + substring(str1, 8));
//        System.out.println("===" + substring(str1, 9));
//        System.out.println("===" + substring(str1, 10));
//    }
}
