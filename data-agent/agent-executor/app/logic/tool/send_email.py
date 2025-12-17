import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import traceback


async def send_email_tool(inputs, props, resource, data_source_config, context=None):
    smtp_server = props.get("smtp_server")
    smtp_port = props.get("smtp_port")
    smtp_user = props.get("smtp_user")
    smtp_password = props.get("smtp_password")

    subject = inputs["subject"]
    content = inputs["content"]
    recipients = inputs["recipients"]

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject

    msg.attach(MIMEText(content, "plain"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, recipients, msg.as_string())

        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}
