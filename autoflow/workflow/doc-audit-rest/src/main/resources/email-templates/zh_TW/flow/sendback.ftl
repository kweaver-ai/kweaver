<#-- 邮件模板-文档流转审核员退回邮件提醒（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>您的文件流轉/收集申請已退回</span>
        </div>
        <#if auditMsg??>
            <p><span style="display:inline-block;width:92px;">退回理由：</span><span>${auditMsg}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>檢視詳情</a></div>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>