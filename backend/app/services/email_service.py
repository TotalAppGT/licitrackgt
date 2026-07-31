import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from io import BytesIO

from app.config import settings


def _conectar():
    ctx = ssl.create_default_context()
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30)
    server.starttls(context=ctx)
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    return server


async def enviar_correo(destinatarios: list[str], asunto: str, html: str,
                        adjunto: tuple[str, bytes, str] = None):
    if not settings.SMTP_HOST:
        raise RuntimeError("SMTP no configurado")
    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = ", ".join(destinatarios)
    msg["Subject"] = asunto
    msg.attach(MIMEText(html, "html", "utf-8"))
    if adjunto:
        nombre, datos, mime_tipo = adjunto
        part = MIMEBase(*mime_tipo.split("/"))
        part.set_payload(datos)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={nombre}")
        msg.attach(part)
    server = _conectar()
    try:
        server.sendmail(settings.EMAIL_FROM, destinatarios, msg.as_string())
    finally:
        server.quit()
