<#-- 邮件模板-单个申请给审核员发送邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>${applyUserName} 对文档 </span>
            <span>“</span>
            <span title="${docName}">${docNameSub}</span>
            <span>”发起了文档域同步，请您审核</span>
        </div>
        <div style="margin-top: 10px;">文档路径：<span title="${docPath}">${docPathSub}</span></div>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC;font-size: 14px;font-weight:900; text-decoration: none;" href="${asUrl}" target='_blank'>前往审核</a></div>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>