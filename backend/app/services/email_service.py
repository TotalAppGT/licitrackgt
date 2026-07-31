import httpx

from app.config import settings

RESEND_API = "https://api.resend.com/emails"


async def enviar_correo(destinatarios: list[str], asunto: str, html: str,
                        adjunto: tuple[str, bytes, str] = None):
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY no configurada")
    payload = {
        "from": settings.EMAIL_FROM,
        "to": destinatarios,
        "subject": asunto,
        "html": html,
        "options": {"click_tracking": False},
    }
    if adjunto:
        nombre, datos, mime_tipo = adjunto
        import base64
        payload["attachments"] = [{
            "filename": nombre,
            "content": base64.b64encode(datos).decode(),
            "content_type": mime_tipo,
        }]
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(RESEND_API, headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        }, json=payload)
    if resp.status_code >= 400:
        raise RuntimeError(f"Resend error {resp.status_code}: {resp.text[:300]}")
