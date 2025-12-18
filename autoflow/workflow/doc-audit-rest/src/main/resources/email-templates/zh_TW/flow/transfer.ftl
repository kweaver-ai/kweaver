<#-- 邮件模板-给转审审核员发送邮件通知（繁体） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>[${applyUserName}] 的[${applyTypeName}]申請, 請您簽核</span>
        </div>
            <p><span style="display:inline-block;width:92px;">流轉名稱：</span><span>${flowName}</span></p>
            <p><span style="display:inline-block;width:92px;">流轉建立者：</span><span>${creatorName}</span></p>
            <p><span style="display:inline-block;width:92px;">發起者：</span><span>${applyCreatorName}</span></p>
            <p><span style="display:inline-block;width:92px;">源檔案：</span><span>${docName}</span></p>
            <p><span style="display:inline-block;width:92px;">目標位置：</span><span>${docPath}</span></p>
            <#if transferMsg??>
                <p><span style="display:inline-block;width:92px;">轉審備註：</span><span>${transferMsg}</span></p>
            </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>前往簽核</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>
