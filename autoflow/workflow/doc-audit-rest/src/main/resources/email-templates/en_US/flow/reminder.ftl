<#-- 邮件模板-申请人给审核员发送催办邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>Approval Reminder for ${applyUserName}'s ${applyTypeName}</span>
        </div>
            <p><span style="display:inline-block;width:92px;">Relay name: </span><span>${flowName}</span></p>
            <p><span style="display:inline-block;width:92px;">Relay created by: </span><span>${creatorName}</span></p>
            <p><span style="display:inline-block;width:92px;">Started by: </span><span>${applyCreatorName}</span></p>
            <p><span style="display:inline-block;width:92px;">Source file: </span><span>${docName}</span></p>
            <p><span style="display:inline-block;width:92px;">Target location: </span><span>${docPath}</span></p>
            <#if remark?has_content>
                <p><span style="display:inline-block;width:92px;">Note: </span><span>${remark}</span></p>
            </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>Process now</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>
