package com.aishu.doc.audit.model.dto;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@ApiModel(value = "浏览目录协议参数对象")
@Data
public class DirListDTO {

    @ApiModelProperty(value = "流程实例id", example = "17b3e670-beeb-11eb-aa79-00ff18ab8db3", required = true)
    @NotBlank(message = "流程实例id不能为空")
    private String proc_inst_id;

    @ApiModelProperty(value = "类型，apply表示我的申请 task表示我的待办", example = "apply", required = true)
    @NotBlank(message = "类型不能为空")
    private String type;

    @ApiModelProperty(value = "文档id", example = "gns://337CF682A29B4B4AAE37947BE99E817B/FD6C37F52BE446FEA563D0A117DC487F", required = true)
    @NotBlank(message = "文档id不能为空")
    private String doc_id;

    @ApiModelProperty(value = "文档库类型，user_doc_lib表示个人文档库 department_doc_lib表示部门文档库 custom_doc_lib表示自定义文档库 knowledge_doc_lib表示知识库", example = "user_doc_lib")
    @ArrayValuable(values = { "user_doc_lib", "department_doc_lib", "custom_doc_lib", "knowledge_doc_lib" }, message = "文档库类型字段值不正确")
    private String doc_lib_type;

    @ApiModelProperty(value = "指定按哪个字段排序，若不指定，默认按docid升序排序，name表示按文件名称（中文按拼音）排序 size表示按大小排序（目录按name升序）time表按服务器修改时间排序", example = "name")
    @ArrayValuable(values = { "name", "size", "time" }, message = "排序字段值不正确")
    private String by;

    @ApiModelProperty(value = "升序还是降序，默认为升序，asc表示升序 desc表示降序", example = "asc")
    @ArrayValuable(values = { "asc", "desc" }, message = "排序值不正确")
    private String sort;

    public String getRequestData() {
        JSONObject json = JSONUtil.createObj();
        json.set("docid", this.getDoc_id());
        json.set("by", this.getBy());
        json.set("sort", this.getSort());
        return json.toString();
    }

}
