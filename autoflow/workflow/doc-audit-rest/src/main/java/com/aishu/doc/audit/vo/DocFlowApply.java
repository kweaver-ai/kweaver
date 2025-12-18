package com.aishu.doc.audit.vo;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

/**
 * @description 文档流转消息实体
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="文档流转消息实体")
public class DocFlowApply {

	@NotBlank(message = "apply_id不能为空")
	@ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
	private String apply_id;

	@ApiModelProperty(value = "上一个审核申请ID，审核退回时，获取旧流程流程信息", required = true)
    private String conflict_apply_id;

	@ApiModelProperty(value = "创建人", hidden = true)
	private String user_id;

	@NotBlank(message = "proc_def_key不能为空")
	@ApiModelProperty(value = "流程定义key", example = "Process_SHARE764", required = true)
	private String proc_def_key;

	@NotBlank(message = "flow_name不能为空")
	@ApiModelProperty(value = "流转名称", example = "文档流转-普通文件", required = true)
	private String flow_name;

	@ApiModelProperty(value = "流转说明", example = "普通文件流转", required = false)
	private String flow_explain;

	@NotBlank(message = "flow_strategy_creator不能为空")
	@ApiModelProperty(value = "流转创建者", example = "张三", required = true)
	private String flow_strategy_creator;

	@NotBlank
	@ApiModelProperty(value = "目标文档全路径名称", example = "Anyshare://技术中心", required = true)
	private String target_path;

	@NotBlank(message = "doc_lib_type不能为空")
	@ArrayValuable(values = {"user_doc_lib", "department_doc_lib", "custom_doc_lib", "knowledge_doc_lib"}, message = "所属文件库类型不正确")
	@ApiModelProperty(value = "所属文件库类型 user_doc_lib 个人文档库，department_doc_lib 部门文档库，custom_doc_lib 自定义文档库，knowledge_doc_lib 知识库", example = "user_doc_lib", required = true)
	private String doc_lib_type;

	@Valid
	@ApiModelProperty(value = "文档信息")
	private DocFlowApplyDoc[] docs;

	@Valid
	@ApiModelProperty(value = "允许流转的所有文档信息")
	private DocFlowApplyDocList[] doc_list;

	@Valid
	@ApiModelProperty(value = "流转类型")
	private String apply_type;

	@ApiModelProperty(value = "审核退回", example = "true")
	private Boolean send_back; 

	@ApiModelProperty(value = "流程id", example = "")
	private String flow_id; 

	/**
	 * @description 构建文档审核实体对象
	 * @author ouandyang
	 * @updateTime 2021/8/9
	 */
	public DocAuditApplyModel builderDocAuditApplyModel(){
		DocAuditApplyModel docAuditApplyModel = DocAuditApplyModel.builder()
				.bizId(this.getApply_id())
				.applyUserId(this.getUser_id())
				.bizType(DocConstants.BIZ_TYPE_FLOW)
				.applyType(DocConstants.BIZ_TYPE_FLOW)
				.procDefKey(this.getProc_def_key())
				.build();
		DocFlowApplyDoc doc = this.getDocs()[0];
		if (this.getDocs() != null && this.getDocs().length == 1) {
			docAuditApplyModel.setDocId(doc.getId());
			docAuditApplyModel.setDocPath(doc.getPath());
			docAuditApplyModel.setDocType(doc.getType());
			docAuditApplyModel.setCsfLevel(getMaxCsfLevel(this.getDocs()));
		}else{
			//截取文档路径
			int pathNumber = doc.getPath().indexOf("//") + 2;
			int idNumber = doc.getId().indexOf("//") + 2;
			String path = doc.getPath().substring(pathNumber);
			docAuditApplyModel.setDocPath(doc.getPath().substring(0, pathNumber)+path.substring(0, path.lastIndexOf("/")));
			docAuditApplyModel.setDocType(DocConstants.DOC_TYPE_MULTIPLE);
			//查询最大的密级
			docAuditApplyModel.setCsfLevel(getMaxCsfLevel(this.getDocs()));
			//截取文档ID
			String docId = doc.getId().substring(idNumber);
			docAuditApplyModel.setDocId(doc.getId().substring(0, idNumber)+docId.substring(0, docId.lastIndexOf("/")));
		}

		JSONObject detail = JSONUtil.createObj();
		detail.set("flowName", this.getFlow_name());
		detail.set("flowStrategyCreator", this.getFlow_strategy_creator());
		detail.set("flowExplain", this.getFlow_explain());
		detail.set("targetPath", this.getTarget_path());
		detail.set("docs", this.getDocs());
		detail.set("docList", this.getDoc_list());
		detail.set("docLibType", this.getDoc_lib_type());
		detail.set("send_back", this.getSend_back());
		detail.set("conflict_apply_id", this.getConflict_apply_id());
		detail.set("flow_id", this.getFlow_id());
		if (StrUtil.isNotBlank(this.getApply_type())) {
			detail.set("apply_type", this.getApply_type());
		}
		jointDocName(docAuditApplyModel);
		docAuditApplyModel.setApplyDetail(detail.toString());
		return docAuditApplyModel;
	}

	/**
	 * @description 拼接名文件名称
	 * @param docAuditApplyModel 文档审核申请实体
	 * @author xiashenghui
	 * @create 2022/4/12
	 *
	 */
	public DocAuditApplyModel jointDocName(DocAuditApplyModel docAuditApplyModel){
		StringBuffer docNames = new StringBuffer();
		List<DocAuditDetailModel> docAuditDetailModelList = new ArrayList<DocAuditDetailModel>();
		for (int i = 0; i < this.getDocs().length; i++) {
			DocFlowApplyDoc docFlowApplyDoc = this.getDocs()[i];
			docAuditDetailModelList.add(DocAuditDetailModel.builder()
					.docId(docFlowApplyDoc.getId())
					.docPath(docFlowApplyDoc.getPath())
					.docType(docFlowApplyDoc.getType())
					.csfLevel(docFlowApplyDoc.getCsf_level())
					.build());
			docNames.append(DocUtils.getDocNameByPath(this.getDocs()[i].getPath()));
			if (i == 2 && this.getDocs().length > 3) {
				docNames.append("...");
				break;
			}
			if(i < this.getDocs().length-1) {
				docNames.append("，");
			}
		}
		docAuditApplyModel.setDocNames(docNames.toString());
		docAuditApplyModel.setDocAuditDetailModels(docAuditDetailModelList);
		return docAuditApplyModel;
	}
	/**
	 * @description 获取最大的密级
	 * @param docs 文件信息
	 * @author xiashenghui
	 * @create 2022/4/12
	 *
	 */
	public int getMaxCsfLevel(DocFlowApplyDoc [] docs){
		int maxLevel =0;
		for (int i = 0; i <docs.length; i++) {
			if(maxLevel<docs[i].getCsf_level()){
				maxLevel=docs[i].getCsf_level();
			}
		}
		return maxLevel;
	}

}
