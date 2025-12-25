<#-- 邮件模板-文档域同步发起人撤销申请给审核员发送邮件（中文） -->
<div style="max-width:1200px; border:1px solid #ddd;box-sizing: border-box; width:100%;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span> 您發起的文件流轉/文件收集申請已失效
                <span style="color: #ff0000;">已失效</span>
                ，請聯繫流轉建立者檢查流轉任務狀態是否正常
            </span>
        </div>
        <p><span style="display:inline-block;width:92px;">名稱：</span><span>文件流轉</span></p>
        <p><span style=" display:inline-block ;width:92px;">流轉建立者：</span><span>${flowStrategyCreator}</span></p>
        <p><span style=" display:inline-block ;width:92px;">發起者：</span><span>${applyUserName} </span></p>
        <p><span style="display:inline-block;width:92px;">源文件：</span><span>${sourceDocument}</span></p>
        <p>	<span style="display:inline-block;width:85px;">目標位置：</span><span>${targetPath}</span></p>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">這是系統郵件，無需回復</div>
    </div>
</div>