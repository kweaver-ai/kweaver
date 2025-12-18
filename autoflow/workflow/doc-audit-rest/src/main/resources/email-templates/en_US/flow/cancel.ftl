<#-- 邮件模板-文档域同步发起人撤销申请给审核员发送邮件（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span> This workflow has
                <span style="color: #ff0000;">expired</span>
                . Contact the user who created the relay to check the relay status
            </span>
        </div>
        <p><span style="display:inline-block;width:92px;">Name：</span><span>Doc Relay</span></p>
        <p><span style=" display:inline-block ;width:92px;">Created by：</span><span>${flowStrategyCreator}</span></p>
        <p><span style=" display:inline-block ;width:92px;">Started by：</span><span>${applyUserName} </span></p>
        <p><span style="display:inline-block;width:92px;">Source：</span><span>${sourceDocument}</span></p>
        <p>	<span style="display:inline-block;width:92px;">Target：</span><span>${targetPath}</span></p>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">This is the system email. Please do not reply.</div>

    </div>
</div>