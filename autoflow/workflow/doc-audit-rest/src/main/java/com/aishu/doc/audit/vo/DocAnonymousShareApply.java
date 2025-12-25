package com.aishu.doc.audit.vo;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.audit.model.DocAuditDetailModel;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;

import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.wf.core.engine.util.WorkFlowContants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * @description 文件匿名共享消息实体
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="共享给任意用户的申请-消息实体")
public class DocAnonymousShareApply {

	@NotBlank(message = "apply_id不能为空")
	@ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
	private String apply_id;

	@ApiModelProperty(value = "创建人", hidden = true)
	private String user_id;

	@NotBlank(message = "operation不能为空")
	@ArrayValuable(values = {"create", "modify", "delete"}, message = "权限操作类型不正确")
	@ApiModelProperty(value = "权限操作类型 create表示新增 modify表示编辑 delete表示删除", example = "create", required = true)
	private String operation;
	
	@NotBlank(message = "expires_at不能为空")
	@ApiModelProperty(value = "截止时间；永久有效为-1", example = "2021-01-01 00:00", required = true)
	private String expires_at;

	@NotBlank(message = "link_id不能为空")
	@ApiModelProperty(value = "ShareedLink地址link值", example = "AA990D644BF12E432DB01E8E4AAB5F981D")
	private String link_id;

	@NotBlank(message = "title不能为空")
	@ApiModelProperty(value = "链接标题", example = "文本文档.txt")
	private String title;

	@ApiModelProperty(value = "提取码", example = "123456")
	private String password;

	@NotNull(message = "access_limit不能为空")
	@ApiModelProperty(value = "打开次数限制 -1为无限制", example = "-1")
	private Integer access_limit;

	@NotNull(message = "perm不能为空")
	@ApiModelProperty(value = "共享权限(delete删除,modify修改,create新建,preview预览,download下载,display显示)", example = "read,display", required = true)
	private String[] perm;

	@Valid
	@ApiModelProperty(value = "文档对象")
	private DocShareApplyDoc doc;

	/**
	 * @description 构建文档审核实体对象
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	public DocAuditApplyModel builderDocAuditApplyModel(){
		this.customVaild();
		DocAuditApplyModel docAuditApplyModel = DocAuditApplyModel.builder()
				.bizId(this.getApply_id())
				.applyUserId(this.getUser_id())
				.applyType(DocConstants.BIZ_TYPE_ANONYMITY_SHARE)
				.docId(this.getDoc().getId())
				.docPath(this.getDoc().getPath())
				.docType(this.getDoc().getType())
				.bizType(DocConstants.BIZ_TYPE_ANONYMITY_SHARE)
				.procDefKey(WorkFlowContants.ANONYMITY_SHARE_PROC_DEF_KEY)
				.build();
		if (this.getDoc().getCsf_level() != null) {
			docAuditApplyModel.setCsfLevel(this.getDoc().getCsf_level());
		} else {
			docAuditApplyModel.setCsfLevel(this.getDoc().getMax_csf_level());
		}
		JSONObject detail = JSONUtil.createObj();
		detail.set("docLibType", this.getDoc().getDoc_lib_type());
		if (this.getPerm() != null && this.getPerm().length > 0) {
			detail.set("allowValue", ArrayUtil.join(this.getPerm(), ","));
		}
		if (StrUtil.isNotBlank(this.getExpires_at())) {
			detail.set("expiresAt", this.getExpires_at());
		}
		if (StrUtil.isNotBlank(this.getOperation())) {
			detail.set("opType", this.getOperation());
		}
		if (StrUtil.isNotBlank(this.getLink_id())) {
			detail.set("linkId", this.getLink_id());
		}
		if (this.getTitle() != null) {
			detail.set("title", this.getTitle());
		}
		if (this.getPassword() != null) {
			detail.set("password", this.getPassword());
		}
		if (this.getAccess_limit() != null) {
			detail.set("accessLimit", this.getAccess_limit());
		}
		List<DocAuditDetailModel> docAuditDetailModelList = new ArrayList<DocAuditDetailModel>();
		DocShareApplyDoc doc = this.getDoc();
		docAuditDetailModelList.add(DocAuditDetailModel.builder()
				.docId(doc.getId())
				.docPath(doc.getPath())
				.docType(doc.getType())
				.csfLevel(doc.getCsf_level())
				.build());
		docAuditApplyModel.setDocNames(DocUtils.getDocNameByPath(doc.getPath()));
		docAuditApplyModel.setDocAuditDetailModels(docAuditDetailModelList);
		docAuditApplyModel.setApplyDetail(detail.toString());
		return docAuditApplyModel;
	}

	/**
	 * @description 自定义参数校验
	 * @author ouandyang
	 * @updateTime 2021/5/13
	 */
	private void customVaild() {
		//		if (StrUtil.isBlank(this.getUser_id())) {
//			throw new IllegalArgumentException("user_id不能为空");
//		}
		if (DocConstants.DOC_TYPE_FILE.equals(this.getDoc().getType()) && this.getDoc().getCsf_level() == null) {
			throw new IllegalArgumentException("csf_level不能为空");
		}
		if (DocConstants.DOC_TYPE_FOLDER.equals(this.getDoc().getType()) && this.getDoc().getMax_csf_level() == null) {
			throw new IllegalArgumentException("max_csf_level不能为空");
		}
	}

}
