import smtplib
from email.message import EmailMessage
from jinja2 import Environment, FileSystemLoader
from app.core.config import settings

env = Environment(loader=FileSystemLoader("app/templates/emails"))

def render_template(template_name: str, context: dict) -> str:
    template = env.get_template(template_name)
    return template.render(context)

def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to
    msg.set_content("Ваш клиент не поддерживает HTML.")
    msg.add_alternative(body, subtype="html")

    with smtplib.SMTP_SSL(settings.MAIL_SERVER, settings.MAIL_PORT) as smtp:
        smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        smtp.send_message(msg)
