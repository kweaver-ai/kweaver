<#-- 邮件模板-单个申请给共享者发送邮件通知（中文） -->

<#-- 邮件内容 -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700;font-size:16px;">
            <#if type == "automation">
                <span>The "${applyTypeName}" you requested has been </span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">approved</span>
                <#else>
                    <span style="color: #E60012;">rejected</span>
                </#if>
            <#else>
                <span>【${titleOem} notice】Your workflow for ${applyTypeName} Collector has been </span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">approved</span>
                <#else>
                    <span style="color: #E60012;">rejected</span>
                </#if>
            </#if>
        </div>
        <#list msgForEmailContentList! as mfec>
            <p><span style="display:inline-block;">${mfec}</span></p>
        </#list>
        <#if auditIdea != 'true' && auditMsg??>
            <p><span style="display:inline-block;">Comments：${auditMsg}</span></p>
        </#if>
        <#if attachments??>
            <p><span style="display:inline-block;">Attachment：${attachments}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>Details</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>