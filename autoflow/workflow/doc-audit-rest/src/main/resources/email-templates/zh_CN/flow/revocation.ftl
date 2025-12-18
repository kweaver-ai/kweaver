<#-- 邮件模板-文档域同步发起人撤销申请给审核员发送邮件（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>${applyUserName} 发起的文档流转/文档收集申请，已撤销。</span>
        </div>
        <p><span style="display:inline-block;width:92px;">名称：</span><span>${flowName}</span></p>
        <p><span style=" display:inline-block ;width:92px;">流转创建者：</span><span>${flowStrategyCreator}</span></p>
        <p><span style=" display:inline-block ;width:92px;">发起者：</span><span>${applyUserName} </span></p>
        <p><span style="display:inline-block;width:92px;">源文档：</span><span>${sourceDocument}</span></p>
        <p>	<span style="display:inline-block;width:92px;">目标位置：</span><span>${targetPath}</span></p>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">此为系统邮件，无需回复</div>
    </div>
</div>