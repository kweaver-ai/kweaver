<#-- 邮件模板-单个申请给审核员发送邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
        <#if type == "automation">
            <span>${applyUserName}發起的"${applyTypeName}", 請您簽核</span>
        <#else>
            <span>【${titleOem}通知】[${applyUserName}]的[${applyTypeName}]申請</span>
        </#if>
        </div>
        <#list msgForEmailContentList! as mfec>
            <p><span style="display:inline-block;">${mfec}</span></p>
        </#list>
        <#if transferMsg??>
            <p><span style="display:inline-block;">轉審備註：${transferMsg}</span></p>
        </#if>
        <#if counterSignMsg??>
            <p><span style="display:inline-block;">加簽備註：${counterSignMsg}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>前往簽核</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">這是系統郵件，無需回復</div>
    </div>
</div>

<#-- 邮件模板-单个申请给共享者发送邮件通知（中文） -->


