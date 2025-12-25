<#-- 邮件模板-单个申请给共享者发送邮件通知（英文） -->

<#-- 邮件内容 -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <#-- 共享申请、所有者申请 -->
        <#if type == "perm" || type == "owner">
            <div style="font-weight: 700; font-size:16px;">
                <span >Your request for sharing file </span>
                <span>"</span>
                <span title="${docName}">${docNameSub}</span>
                <span>"</span>
                <span > with </span>
                <span>"${accessorName}"</span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;"> has been </span>
                <#else>
                    <span style="color: #E60012;"> has not been </span>
                </#if>
                approved
            </div>
        <#-- 更改继承申请 -->
        <#elseif type == "inherit">
            <div style="font-weight: 700; font-size:16px;">

                <#if (inherit?string('yes', 'no')) == 'yes'> Your action to enabled the inherited permissions</#if>
                <#if (inherit?string('yes', 'no')) == 'no'>Your action to disabled the inherited permissions  </#if>

                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">has been </span>
                <#else>
                    <span style="color: #E60012;">has not been </span>
                </#if>
                approved
            </div>
        <#-- 匿名申请 -->
        <#elseif type == "anonymous">
            <div style="font-weight: 700; font-size:16px;">
                <span >Your sharedLink of file </span>
                <span>"</span>
                <span title="${docName}">${docNameSub}</span>
                <span>"</span>
                <span > for anyone </span>
                <#if auditIdea == 'true'>
                    <span style="color: #60BC9F;">has been </span>
                <#else>
                    <span style="color: #E60012;">has not been </span>
                </#if>
                approved
            </div>
        <#if auditIdea == 'true'>
            <p><span style="display:inline-block;width:95px;">SharedLink：</span><span>${sharedLink}</span></p>
            <p><span style="display:inline-block;width:95px;">Pickup Code：</span><span>${passWord}</span></p>
        </#if>
        </#if>
        <#if auditIdea != 'true' && auditMsg??>
            <p  style="display: table;width: 100%;"><span style="display: table-cell;width:92px;vertical-align: top;">Comments：</span><span style=" display: table-cell; vertical-align: top; ">${auditMsg}</span></p>
        </#if>
        <#if attachments??>
            <p  style="display: table;width: 100%;"><span style="display: table-cell;width:92px;vertical-align: top;">Attachment：</span><span style=" display: table-cell; vertical-align: top; ">${attachments}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>Details</a></div>

        <div style="margin-top: 23px; color: #999999; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>