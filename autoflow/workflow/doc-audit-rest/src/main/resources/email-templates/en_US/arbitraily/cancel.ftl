<#-- 邮件模板-文档域同步发起人撤销申请给审核员发送邮件（中文） -->
<div style="width:1200px; border:1px solid #ddd;box-sizing: border-box;">
    <img style="width:100%;" src="cid:image"/>
    <div style="padding: 40px;font-family: Arial,sans-serif;color: #333;font-size: 14px; word-break:break-all;">
        <div style="font-weight: 700; font-size:16px;">
            <span>【${titleOem} notice】Your workflow for ${applyTypeName} Collector has expired</span>
        </div>
        <#list msgForEmailContentList! as mfec>
            <p><span style="display:inline-block;">${mfec}</span></p>
        </#list>
        <div style="margin-top: 20px; color: gray; font-size: 13px;">This is the system email. Please do not reply.</div>
    </div>
</div>