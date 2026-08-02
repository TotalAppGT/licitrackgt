import httpx
from app.config import settings

WHATSAPP_API = "https://graph.facebook.com/v22.0"


WHATSAPP_TEMPLATE = "alerta_totalappgt"
WHATSAPP_TEMPLATE_LANG = "es_MX"
WHATSAPP_TEMPLATE_FOOTER = "TotalAppGT"


async def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        return False
    texto = (mensaje or "").strip().replace("\n", " ")
    if len(texto) > 900:
        texto = texto[:897] + "..."
    try:
        async with httpx.AsyncClient(timeout=20) as cl:
            resp = await cl.post(
                f"{WHATSAPP_API}/{settings.WHATSAPP_PHONE_ID}/messages",
                headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
                         "Content-Type": "application/json"},
                json={
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": telefono,
                    "type": "template",
                    "template": {
                        "name": WHATSAPP_TEMPLATE,
                        "language": {"code": WHATSAPP_TEMPLATE_LANG},
                        "components": [
                            {"type": "body",
                             "parameters": [{"type": "text", "text": texto}]}
                        ],
                    },
                },
            )
        data = resp.json()
        if resp.status_code >= 400:
            print(f"WhatsApp error {resp.status_code}: {resp.text[:200]}")
            return False
        ws_id = (data.get("messages") or [{}])[0].get("id", "")
        print(f"WhatsApp enviado a {telefono}, msg_id={ws_id}")
        return True
    except Exception as e:
        print(f"WhatsApp exception: {e}")
        return False


def verificar_webhook(mode: str, token: str, challenge: str) -> str | None:
    if not settings.WHATSAPP_VERIFY_TOKEN:
        return None
    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return challenge
    return None
