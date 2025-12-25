<#-- 邮件模板-文档域同步发起人撤销申请给审核员发送邮件（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <#if type == "automation">
                <span>${applyUserName}發起的"${applyTypeName}", 已撤銷</span>
            <#else>
                <span>【${titleOem}通知】[${applyUserName}]的[${applyTypeName}]申請已撤銷</span>
            </#if>
        </div>
        <#list msgForEmailContentList! as mfec>
            <p><span style="display:inline-block;">${mfec}</span></p>
        </#list>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">這是系統郵件，無需回復</div>
    </div>
</div>