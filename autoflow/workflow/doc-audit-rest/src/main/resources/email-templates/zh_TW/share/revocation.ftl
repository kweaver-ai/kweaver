<#-- 邮件模板-文档共享发起人撤销申请给审核员发送邮件（繁体） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} 對文件 “</span>
                <span title="${docName}">${docNameSub}</span>
                <#if secretSwitch == 'y'><span>” 發起的內部授權的申請已撤銷。</span></#if>
                <#if secretSwitch == 'n'><span>” 發起的共用給指定使用者的申請已撤銷。</span></#if>
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700; font-size:16px;">${applyUserName} 撤销
                <#if (inherit?string('yes', 'no')) == 'yes'>恢復</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>停用</#if>
                從上級繼承的權限 申請。
            </div>
        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} 對文件 “</span>
                <span title="${docName}">${docNameSub}</span>
                <span>” 發起的共用給任意使用者的申請已撤銷。</span>
            </div>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">這是系統郵件，無需回復</div>
    </div>
</div>