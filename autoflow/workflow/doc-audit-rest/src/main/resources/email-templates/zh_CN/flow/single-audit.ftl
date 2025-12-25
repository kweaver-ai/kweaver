<#-- 邮件模板-单个申请给审核员发送邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>${applyUserName}  </span>
            <span>发起了文档流转/文档收集申请，请您审核</span>
        </div>
        <p><span style="display:inline-block;width:92px;">名称：</span><span>${flowName}</span></p>
        <p><span style=" display:inline-block ;width:92px;">流转创建者：</span><span>${flowStrategyCreator}</span></p>
        <p><span style=" display:inline-block ;width:92px;">发起者：</span><span>${applyUserName}</span></p>
        <p><span style="display:inline-block;width:92px;">源文档：</span><span>${sourceDocument}</span></p>
        <p><span style="display:inline-block;width:92px;">目标位置：</span><span>${targetPath}</span></p>
        <#if counterSignMsg??>
            <p><span style="display:inline-block;width:92px;">加签备注：</span><span>${counterSignMsg}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>前往审核</a></div>
        <div style="margin-top: 23px; color: #999999; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>


<#-- 邮件模板-单个申请给共享者发送邮件通知（中文） -->


