<#-- 邮件模板-单个申请给审核员发送邮件通知（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>${applyUserName}  </span>
            <span>has started the Doc Relay/File Collector, and is waiting for your approval</span>
        </div>
        <p><span style="display:inline-block;width:92px;">Name：</span><span>Doc Relay</span></p>
        <p><span style=" display:inline-block ;width:92px;">Created by：</span><span>${flowStrategyCreator}</span></p>
        <p><span style=" display:inline-block ;width:92px;">Started by：</span><span>${applyUserName} </span></p>
        <p><span style="display:inline-block;width:92px;">Source：</span><span>${sourceDocument}</span></p>
        <p><span style="display:inline-block;width:92px;">Target：</span><span>${targetPath}</span></p>
        <#if counterSignMsg??>
            <p><span style="display:inline-block;width:92px;">Remark：</span><span>${counterSignMsg}</span></p>
        </#if>
        <div style="margin-top: 20px; color: gray; font-size: 13px;"> <a style="color: #3461EC; text-decoration: none;font-size: 14px;font-weight:900;" href="${asUrl}" target='_blank'>Go to process</a></div>

        <div style="margin-top: 23px; color: #999999; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>


<#-- 邮件模板-单个申请给共享者发送邮件通知（中文） -->


