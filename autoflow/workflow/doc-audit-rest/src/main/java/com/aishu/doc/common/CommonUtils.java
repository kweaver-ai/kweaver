package com.aishu.doc.common;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;

import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 公用工具
 * @author ouandyang
 * @date 2021年4月20日10:56:42
 */
public class CommonUtils {

    /**
     * @description 分割集合
     * @author ouandyang
     * @param  list 集合
     * @param  length 分割大小
     * @updateTime 2021/9/3
     */
    public static List<List<String>> splitList(List<String> list, int length) {
        List<List<String>> result = new ArrayList<List<String>>();
        int size = list.size();
        int count = (size + length - 1) / length;
        for (int i = 0; i < count; i++) {
            List<String> subList = list.subList(i * length, ((i + 1) * length > size ? size : length * (i + 1)));
            result.add(subList);
        }
        return result;
    }


    /**
     * @description JSON转Map
     * @author xiashneghui
     * @param  json json字符串
     * @param  key 键
     * @updateTime 2022/9/21
     */
    public static  Map<String, Object> jsonToMap(JSONObject json, String  key) {
        if(json.getStr(key) !=null){
            Map<String, Object> map = JSON.parseObject(json.getStr(key), HashMap.class);
            Map<String, Object> Obj = Maps.newHashMap();
            map.forEach((k, v) -> Obj.put(StrUtil.toUnderlineCase(k), v));
            return Obj;
        }
        return null;
    }

    /**
     * @description JSON转Map
     * @author xiashneghui
     * @param  jsonStr json字符串
     * @updateTime 2022/9/21
     */
    public static  Map<String, Object> jsonStrToMap(String jsonStr) {
        if(StrUtil.isNotEmpty(jsonStr)){
            Map<String, Object> map = JSON.parseObject(jsonStr, HashMap.class);
            Map<String, Object> Obj = Maps.newHashMap();
            map.forEach((k, v) -> Obj.put(StrUtil.toUnderlineCase(k), v));
            return Obj;
        }
        return null;
    }

    /**
     * @description byte大小转对应B、KB、MB、GB、TB
     * @author siyu.chen
     * @param  scientificNotation 科学计数
     * @updateTime 2023/6/1
     */
    public static String formatFileSize(String scientificNotation, Boolean reWriteByte) {
        double number = Double.parseDouble(scientificNotation);
        // 将科学计数转换为数字
        long convertedNumber = (long) number;
        if (convertedNumber <= 0) {
            return !reWriteByte ? "0 B" : "0 字节（Bytes）";
        }
        final String[] units = { "B", "KB", "MB", "GB", "TB", "PB" };
        int digitGroups = (int) (Math.log10(convertedNumber) / Math.log10(1024));
        // 处理超出范围的情况，最大单位保持 PB
        if (digitGroups >= units.length) {
            digitGroups = units.length - 1;
        }
        double result = convertedNumber / Math.pow(1024, digitGroups);
        String unit = units[digitGroups];
        if (digitGroups == 0 && reWriteByte) {
            unit = "字节（Bytes）";
        }
        // 判断结果是否为整数，如果是整数则不保留小数部分
        if (result == (long) result) {
            return (long) result + " " + unit;
        }
        return String.format("%.2f %s", result, unit);
    }

    public static long dateToStamp(Date date) {
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        try{
            String strdate = simpleDateFormat.format(date);
            Date fomatDate = simpleDateFormat.parse(strdate);
            return fomatDate.getTime();
        } catch (Exception e) {};
        return (long) 0;
    }

    public static long CurrentTimeStamp() {
        return System.currentTimeMillis();
    }

    public static long FeatureTimeStamp(int days) {
        Instant now = Instant.now();
        Instant sevenDaysLater = now.plusSeconds(days * 24 * 60 * 60);
        return sevenDaysLater.toEpochMilli();
    }

    public static void main(String[] args) {
        List<String> ids = Lists.newArrayList();
        for (int i = 0; i < 10; i++) {
            ids.add("" + i);
        }
        List<List<String>> result = splitList(ids, 3);
        System.out.println(JSONUtil.toJsonStr(result));
        System.out.println(formatFileSize("0", true));
    }

}
