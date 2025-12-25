<#-- 邮件模板-单个申请给审核员发送邮件通知（繁体） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} </span>
                <span >給 </span>
                <span>${accessorName} </span>
                <#if secretSwitch == 'y'><span >授權了文件</span></#if>
                <#if secretSwitch == 'n'><span >共用了文件</span></#if>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>”，請您簽核</span>
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700;">
                ${applyUserName}
                <#if (inherit?string('yes', 'no')) == 'yes'>恢復了從上級繼承的權限，請您簽核</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>停用了從上級繼承的權限，請您簽核</#if>
            </div>
        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700;">
                <span>${applyUserName} </span>
                <span >對文件 </span>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>”發起了共用給任意使用者的申請，請您簽核</span>
            </div>
        </#if>
        <div style="margin-top: 10px;">文件路徑：<span title="${docPath}">${docPathSub}</span></div>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>前往簽核</a></div>

        <div style="margin-top: 23px; color: #999999; font-size: 13px;">這是系統郵件，無需回復</div>
    </div>
</div>