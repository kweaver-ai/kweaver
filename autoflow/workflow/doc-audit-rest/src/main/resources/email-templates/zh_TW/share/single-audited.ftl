<#-- 邮件模板-单个申请给共享者发送邮件通知（繁体） -->

<#-- 邮件内容 -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span >您給</span>
                <span>${accessorName}</span>
                <#if secretSwitch == 'y'><span >授權的文件</span></#if>
                <#if secretSwitch == 'n'><span >共用的文件</span></#if>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>”</span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">已通過</span>
                <#else>
                    <span style="color: #E60012;">未通過</span>
                </#if>
                <span>簽核</span>
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700; font-size:16px;">
                <#if (inherit?string('yes', 'no')) == 'yes'>您恢復繼承權限的操作，</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>您停用繼承權限的操作，</#if>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">已通過</span>
                <#else>
                    <span style="color: #E60012;">未通過</span>
                </#if>
                簽核
            </div>

        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700; font-size:16px;">
                <span >您對文件</span>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>”</span>
                <span >發起的共用給任意使用者的申請</span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">已通過</span>
                <#else>
                    <span style="color: #E60012;">未通過</span>
                </#if>
                <span>簽核</span>
            </div>
        <#if auditIdea == 'true'>
            <p><span style="display:inline-block;width:92px;">連結：</span><span>${sharedLink}</span></p>
            <p><span style="display:inline-block;width:92px;">提領代碼：</span><span>${passWord}</span></p>
        </#if>
        </#if>
        <#if auditIdea != 'true' && auditMsg??>
            <p  style="display: table;width: 100%;"><span style="display: table-cell;width:92px;vertical-align: top;">簽核意見：</span><span style=" display: table-cell; vertical-align: top; ">${auditMsg}</span></p>
        </#if>
        <#if attachments??>
            <p  style="display: table;width: 100%;"><span style="display: table-cell;width:92px;vertical-align: top;">簽核附件：</span><span style=" display: table-cell; vertical-align: top; ">${attachments}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>檢視詳情</a></div>

        <div style="margin-top: 23px; color: #999999; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>