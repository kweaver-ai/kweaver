<#-- 邮件模板-单个申请给共享者发送邮件通知（中文） -->

<#-- 邮件内容 -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700;font-size:16px;">
            <span>您發起的文件流轉/文件收集 </span>
            <#if auditIdea == 'true'>
                <span style="color: #60BC9F;">已通過</span>
            <#else>
                <span style="color: #E60012;">未通過</span>
            </#if>
            <span>簽核</span>
        </div>
        <#if auditIdea != 'true' && auditMsg??>
            <p  style="display: table;width: 100%;"><span style="display: table-cell;width:92px;vertical-align: top;">簽核意見：</span><span style=" display: table-cell; vertical-align: top; ">${auditMsg}</span></p>
        </#if>
        <#if attachments??>
            <p  style="display: table;width: 100%;"><span style="display: table-cell;width:92px;vertical-align: top;">簽核附件：</span><span style=" display: table-cell; vertical-align: top; ">${attachments}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>檢視詳情</a></div>

        <div style="margin-top: 23px; color: #999999; font-size: 13px;">這是系統郵件，無需回復</div>
    </div>
</div>