package com.aishu.doc.common;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.wf.core.doc.common.DocConstants;
import com.alibaba.fastjson.JSONArray;

import java.util.ArrayList;
import java.util.List;

/**
 * 文档工具
 * @author ouandyang
 * @date 2021年4月20日10:56:42
 */
public class DocUtils {

    /**
     * 权限数值转字符串
     * @param num 13
     * @return 权限字符串 display,read,create
     */
    public static String convertPermToStr(int num) {
        List<String> list = new ArrayList<String>();
        for (DocSharePermEnum item : DocSharePermEnum.values()) {
            if ((item.getValue() & num) > 0) {
                list.add(item.getCode());
            }
        }
        return CollUtil.join(list, ",");
    }

    /**
     * 权限字符串转数值
     * @param str 权限字符串 display,read,create
     * @return num 权限数值 13
     */
    public static int convertPermToNum(String str) {
        int num = 0;
        if(StrUtil.isNotBlank(str)){
            for (DocSharePermEnum item : DocSharePermEnum.values()) {
                if (str.indexOf(item.getCode()) > -1) {
                    num += item.getValue();
                }
            }
        }
        return num;
    }


    /**
     * @description 通过全路径获取文档ID
     * @author hanj
     * @param docId docPath
     * @updateTime 2021/6/15
     */
    public static String convertDocId(String docId){
        String result = "";
        if(StrUtil.isNotBlank(docId)){
            result = docId.substring(docId.lastIndexOf("/") + 1);
        }
        return result;
    }

    /**
     * @description 文档全路径得到文档名称
     * @author ouandyang
     * @param  docPath
     * @updateTime 2021/9/1
     */
    public static String getDocNameByPath(String docPath){
        if (StrUtil.isBlank(docPath)) {
            return docPath;
        }
        return docPath.substring(docPath.lastIndexOf("/") + 1);
    }

    /**
     * @description 根据文档ID截取文档库ID
     * @author ouandyang
     * @param  docId 文档ID
     * @updateTime 2021/9/1
     */
    public static String getDocLibIdByDocId(String docId){
        if (StrUtil.isBlank(docId)) {
            return docId;
        }
        String id = docId.split(DocConstants.GNS_PROTOCOL)[1];
        if (id.indexOf("/") == -1) {
            return docId;
        }
        return DocConstants.GNS_PROTOCOL + id.substring(0, id.indexOf("/"));
    }

    /**
     * @description 根据文件信息集合拼接源文件信息
     * @author xiashenghui
     * @param  objects 集合
     * @updateTime 2021/9/1
     */
    public  static String getSourceFileNames(JSONArray objects){
        StringBuffer str = new StringBuffer();
        String path="";
        for (int i =0 ;i<  objects.size();i++){
            path=JSONUtil.parseObj(objects.get(i)).get("path").toString();
            str.append(path.substring(path.lastIndexOf("/")+1));
            if(i<objects.size()-1){
                str.append("、");
            }
        }
        return str.toString();
    }

    /**
     * 权限字符串转中文描述
     * @param str 权限字符串 display,read,create
     * @return str 中文描述 显示/读取/新建
     */
    public static String convertPermToChinese(String str) {
        if(StrUtil.isBlank(str)){
            return "";
        }
        List<String> list = new ArrayList<String>();
        for (DocSharePermEnum item : DocSharePermEnum.values()) {
            if (str.indexOf(item.getCode()) == -1) {
                continue;
            }
            list.add(item.getRemark());
        }
        return CollUtil.join(list, "/");
    }

    public static void main(String[] args) {
        System.out.println(JSONUtil.toJsonStr(DocSharePermEnum.values()));
        System.out.println(convertPermToNum("display,read,create"));
        System.out.println(convertPermToStr(13));
        System.out.println(convertDocId("gns://1C1F304FE62F4F439A35D5B4F0D05BA5/719CFFFF16C84AF28A7C8AF1DD6ADCA6"));
        System.out.println(getDocNameByPath("gns://1C1F304FE62F4F439A35D5B4F0D05BA5/719CFFFF16C84AF28A7C8AF1DD6ADCA6.doc"));
        System.out.println(getDocLibIdByDocId("gns://1C1F304FE62F4F439A35D5B4F0D05BA5/719CFFFF16C84AF28A7C8AF1DD6ADCA6"));
        System.out.println(getDocLibIdByDocId("gns://1C1F304FE62F4F439A35D5B4F0D05BA5"));

        System.out.println(convertPermToChinese("display,preview,create"));
    }
}
