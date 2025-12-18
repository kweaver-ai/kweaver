<#-- 邮件模板-给转审审核员发送邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>[${applyUserName}] 的[${applyTypeName}]申请, 请您审核</span>
        </div>
        <#if bizType == 'realname'>
            <p><span style="display:inline-block;width:92px;">共享的文档：</span><span>${docName}</span></p>
            <p><span style="display:inline-block;width:92px;">访问者：</span><span>${visitor}</span></p>
            <p><span style="display:inline-block;width:92px;">权限：</span><span>${authority}</span></p>
            <p><span style="display:inline-block;width:92px;">有效期：</span><span>${expairedAt}</span></p>
        </#if>
        <#if bizType == 'anonymous'>
            <p><span style="display:inline-block;width:92px;">共享的文档：</span><span>${docName}</span></p>
            <p><span style="display:inline-block;width:92px;">链接名称：</span><span>${linkName}</span></p>
            <p><span style="display:inline-block;width:92px;">权限：</span><span>${authority}</span></p>
            <p><span style="display:inline-block;width:92px;">有效期：</span><span>${expairedAt}</span></p>
            <p><span style="display:inline-block;width:92px;">提取码：</span><span>${extCode}</span></p>
            <p><span style="display:inline-block;width:92px;">打开次数：</span><span>${openCount}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>前往审核</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>
