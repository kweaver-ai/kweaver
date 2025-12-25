<#-- 邮件模板-文档共享发起人撤销申请给审核员发送邮件（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} 对文档 “</span>
                <span title="${docName}">${docNameSub}</span>
                <#if secretSwitch == 'y'><span>” 发起的内部授权的申请已撤销。</span></#if>
                <#if secretSwitch == 'n'><span>” 发起的共享给指定用户的申请已撤销。</span></#if>
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700; font-size:16px;">${applyUserName} 撤销
                <#if (inherit?string('yes', 'no')) == 'yes'>恢复</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>禁用</#if>
                从上级继承的权限 申请。
            </div>
        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700; font-size:16px;">
                <span>${applyUserName} 对文档 “</span>
                <span title="${docName}">${docNameSub}</span>
                <span>” 发起的共享给任意用户的申请已撤销。</span>
            </div>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>