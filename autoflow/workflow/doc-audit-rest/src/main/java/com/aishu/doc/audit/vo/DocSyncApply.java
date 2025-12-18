package com.aishu.doc.audit.vo;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.aishu.doc.audit.model.DocAuditApplyModel;
import com.aishu.doc.common.DocUtils;
import com.aishu.wf.core.common.validation.annotation.ArrayValuable;
import com.aishu.wf.core.doc.common.DocConstants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * @description 文档同步消息实体
 * @author ouandyang
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value="文档同步消息实体")
public class DocSyncApply {

	@ApiModelProperty(value = "作废申请ID", example = "12c29bd7-9c09-468e-80a2-1af606f25cpl")
	private String conflict_apply_id;
	
	@NotBlank(message = "apply_id不能为空")
	@ApiModelProperty(value = "申请ID", example = "66c29bd7-9c09-468e-80a2-1af606f25ce7", required = true)
	private String apply_id;
	
	@ApiModelProperty(value = "创建人", hidden = true)
	private String user_id;

	@NotBlank(message = "proc_def_key不能为空")
	@ApiModelProperty(value = "流程定义key", example = "Process_SHARE764", required = true)
	private String proc_def_key;

	@NotBlank(message = "mode不能为空")
	@ArrayValuable(values = { DocConstants.DOC_SYNC_MODE_SYNC, DocConstants.DOC_SYNC_MODE_COPY, DocConstants.DOC_SYNC_MODE_MOVE}, message = "同步模式不正确")
	@ApiModelProperty(value = "同步模式 sync表示同步 copy表示拷贝 move表示移动", example = "sync", required = true)
	private String mode;
	
	@NotBlank
	@ApiModelProperty(value = "目标文档全路径名称", example = "Anyshare://技术中心", required = true)
	private String target_path;
	
	@ApiModelProperty(value = "文件黑名单")
	private String[] doc_blacklist;

	@NotBlank
	@ApiModelProperty(value = "文档gns路径", example = "Anyshare://xxxxxx/xxxxxx", required = true)
	private String doc_id;

	/**
	 * @description 构建文档审核实体对象
	 * @author ouandyang
	 * @updateTime 2021/8/9
	 */
	public DocAuditApplyModel builderDocAuditApplyModel(){
		DocAuditApplyModel docAuditApplyModel = DocAuditApplyModel.builder()
				.conflictApplyId(this.getConflict_apply_id())
				.bizId(this.getApply_id())
				.applyUserId(this.getUser_id())
				.bizType(DocConstants.BIZ_TYPE_SYNC)
				.applyType(DocConstants.BIZ_TYPE_SYNC)
				.procDefKey(this.getProc_def_key())
				.docId(this.getDoc_id())
				.build();
		JSONObject detail = JSONUtil.createObj();
		detail.set("mode", this.getMode());
		detail.set("targetPath", this.getTarget_path());
		detail.set("docBlacklist", this.getDoc_blacklist());
		docAuditApplyModel.setApplyDetail(detail.toString());
		return docAuditApplyModel;
	}

}
