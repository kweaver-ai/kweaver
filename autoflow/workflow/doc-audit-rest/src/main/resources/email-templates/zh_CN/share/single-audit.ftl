<#-- 邮件模板-单个申请给审核员发送邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} 给</span>
                <#if secretSwitch == 'y'><span>${accessorName} 授权了文档</span></#if>
                <#if secretSwitch == 'n'><span>${accessorName} 共享了文档</span></#if>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>”，请您审核</span>
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700; font-size:16px;">${applyUserName}
                <#if (inherit?string('yes', 'no')) == 'yes'>恢复了从上级继承的权限，请您审核</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>禁用了从上级继承的权限，请您审核</#if>
            </div>
        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} 对文档</span>
                <span>“</span>
                <span title="${docName}">${docNameSub}</span>
                <span>”发起了共享给任意用户的申请，请您审核</span>
            </div>
        </#if>
        <div style="margin-top: 10px;">文档路径：<span title="${docPath}">${docPathSub}</span></div>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; font-size: 14px;font-weight:900; text-decoration: none;" href="${asUrl}" target='_blank'>前往审核</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>