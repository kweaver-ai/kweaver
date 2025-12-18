<#-- 邮件模板-单个申请给审核员发送邮件通知（英文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>${applyUserName} has created the Doc Domain Sync of file "</span>
            <span title="${docName}">${docNameSub}</span>
            <span>", and requires your approval</span>
        </div>
        <div style="margin-top: 10px;">Location: <span title="${docPath}">${docPathSub}</span></div>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>Go to process</a></div>

        <div style="margin-top: 23px; color: #999999; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>