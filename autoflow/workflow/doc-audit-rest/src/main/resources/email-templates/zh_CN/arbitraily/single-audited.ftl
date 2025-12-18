<#-- 邮件模板-单个申请给共享者发送邮件通知（中文） -->

<#-- 邮件内容 -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700;font-size:16px;">
            <#if type == "automation">
                <span>您发起的"${applyTypeName}", 
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">已通过</span>
                <#else>
                    <span style="color: #E60012;">未通过</span>
                </#if>
                审核</span>
            <#else>
                <span>【${titleOem}通知】您发起的[${applyTypeName}]申请</span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">已通过</span>
                <#else>
                    <span style="color: #E60012;">未通过</span>
                </#if>
            </#if>
        </div>
        <#list msgForEmailContentList! as mfec>
            <p><span style="display:inline-block;">${mfec}</span></p>
        </#list>
        <#if auditIdea != 'true' && auditMsg??>
            <p><span style="display:inline-block;">审批意见：${auditMsg}</span></p>
        </#if>
        <#if attachments??>
            <p><span style="display:inline-block;">审核附件：${attachments}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>查看详情</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>