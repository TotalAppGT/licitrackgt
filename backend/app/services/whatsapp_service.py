import re
import httpx
from app.config import settings

WHATSAPP_API = "https://graph.facebook.com/v22.0"

WHATSAPP_TEMPLATE = "alerta_totalappgt"
WHATSAPP_TEMPLATE_LANG = "es_MX"
WHATSAPP_TEMPLATE_FOOTER = "TotalAppGT"


def _limpiar(texto: str) -> str:
    t = re.sub(r"[\t\n\r]+", " ", (texto or "").strip())
    t = re.sub(r" {4,}", "  ", t)
    if len(t) > 900:
        t = t[:897] + "..."
    return t


def texto_alerta_prueba() -> str:
    return ("PRUEBA DE NOTIFICACION - Tu numero de WhatsApp quedo vinculado correctamente. "
            "Cuando haya nuevos eventos que coincidan con tus keywords, recibiras un aviso como este.")


def texto_alerta_matches(matches: list, hora_str: str = "") -> str:
    n = len(matches)
    cabecera = f"ALERTA DE EVENTOS - {n} nueva(s) coincidencia(s){hora_str}:"
    partes = [f"{m['keyword']}: {m['titulo'][:55]} - Q{float(m['monto'] or 0):,.0f}" for m in matches[:8]]
    return cabecera + "  |  ".join(partes)


def texto_reporte_programado(total: int, keyword_text: str) -> str:
    return (f"REPORTE PROGRAMADO - {total} eventos para '{keyword_text[:40]}'. "
            "El detalle completo (XLSX) fue enviado a tu correo.")


def texto_deadline(label: str, titulo: str, nog: str, entidad: str, monto=None) -> str:
    s = f"RECORDATORIO DE PRESENTACION - {label}: {titulo[:60]} | NOG: {nog} | Entidad: {entidad or 'N/A'}"
    if monto:
        s += f" | Monto: Q{float(monto):,.0f}"
    return s


async def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        return False
    texto = _limpiar(mensaje)
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
