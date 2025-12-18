<#-- 邮件模板-文档共享发起人撤销申请给审核员发送邮件（英文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} has undone the request to share file </span>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>” with users.</span>
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700; font-size:16px;">${applyUserName} has undone the the request to
                <#if (inherit?string('yes', 'no')) == 'yes'>enable</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>disable</#if>
                the inherited permissions from parent folder.
            </div>
        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} has undone the request to share file "</span>
                <span title="${docName}">${docNameSub}</span>
                <span>" with anyone.</span>
            </div>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>