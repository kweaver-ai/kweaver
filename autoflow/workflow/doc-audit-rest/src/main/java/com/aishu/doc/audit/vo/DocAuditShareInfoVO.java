package com.aishu.doc.audit.vo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * @description 共享申请详情（提供给爱数）
 * @author hanj
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "共享审核详情对象")
public class DocAuditShareInfoVO {

    @ApiModelProperty(value = "申请类型，perm表示共享申请 owner表示所有者申请 inherit表示更改继承申请 anonymous表示匿名申请 sync表示同步申请 flow表示流转申请 security表示定密申请", example = "perm")
    private String apply_type;

    @ApiModelProperty(value = "申请人名称", example = "张三")
    private String apply_user_name;

    @ApiModelProperty(value = "发起时间", example = "2020-01-01 00:00:00")
    private Date apply_time;

    @ApiModelProperty(value = "审核模式，tjsh表示同级审核 hqsh表示会签审核 zjsh表示逐级审核", example = "tjsh")
    private String audit_type;

    @ApiModelProperty(value = "审核详情", example = "")
    private ApplyDetailVo apply_detail;

    @Data
    static class ApplyDetailVo {

        @ApiModelProperty(value = "允许权限，delete表示删除 modify表示修改 create表示新建 read表示读取 display表示显示", example = "read,display")
        private String allow;

        @ApiModelProperty(value = "拒绝权限，delete表示删除 modify表示修改 create表示新建 read表示读取 display表示显示", example = "delete,modify")
        private String deny;

        @ApiModelProperty(value = "访问者", example = "张三")
        private String accessor_name;

        @ApiModelProperty(value = "有效期，-1表示永久有效", example = "2020-01-01 00:00:00")
        private String expires_at;

        @ApiModelProperty(value = "权限操作类型，create表示新增 modify表示编辑 delete表示删除", example = "create")
        private String op_type;

        @ApiModelProperty(value = "是否继承权限，true表示恢复继承权限 false表示禁用继承权限", example = "false")
        private Boolean inherit;

        /**
         * @description 构建申请明细详情
         * @author hanj
         * @param  obj
         * @updateTime 2021/5/26
         */
        public static ApplyDetailVo builder(Map<String, Object> obj){
            ApplyDetailVo vo = new ApplyDetailVo();
            if(obj.containsKey("allow_value")){
                vo.setAllow((String) obj.get("allow_value"));
            }
            if(obj.containsKey("deny_value")){
                vo.setDeny((String) obj.get("deny_value"));
            }
            if(obj.containsKey("accessor_name")){
                vo.setAccessor_name((String) obj.get("accessor_name"));
            }
            if(obj.containsKey("expires_at")){
                vo.setExpires_at((String) obj.get("expires_at"));
            }
            if(obj.containsKey("op_type")){
                vo.setOp_type((String) obj.get("op_type"));
            }
            if(obj.containsKey("inherit")){
                vo.setInherit((Boolean) obj.get("inherit"));
            }
            return vo;
        }

    }

    /**
     * @description 构建共享申请详情
     * @author hanj
     * @param  docAuditApplyModel
     * @updateTime 2021/5/26
     */
    public static DocAuditShareInfoVO builder(DocAuditApplyModel docAuditApplyModel){
        DocAuditShareInfoVO vo = new DocAuditShareInfoVO();
        Map<String, Object> map = Maps.newHashMap();
        BeanUtil.beanToMap(docAuditApplyModel).forEach((k, v) -> map.put(StrUtil.toUnderlineCase(k), v));
        BeanUtil.copyProperties(map, vo);
        Map<String, Object> obj = JSON.parseObject(docAuditApplyModel.getApplyDetail(), HashMap.class);
        Map<String, Object> detailObj = Maps.newHashMap();
        obj.forEach((k, v) -> detailObj.put(StrUtil.toUnderlineCase(k), v));
        vo.setApply_detail( ApplyDetailVo.builder(detailObj));
        return vo;
    }

}
