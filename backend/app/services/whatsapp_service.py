import re
import httpx
import asyncio
from app.config import settings

WHATSAPP_API = "https://graph.facebook.com/v22.0"
PROXY_URL = "https://webhook-meta-production-bb93.up.railway.app"
PROXY_API_KEY = "proxy_master_2026_secret"
LICITRACK_SYSTEM_ID = "b24abb0a"

WHATSAPP_TEMPLATE = "notificacion_sistema_ia"
WHATSAPP_TEMPLATE_LANG = "es_MX"

SISTEMA_NOMBRE = "LiciTrackGT"


def _limpiar(texto: str) -> str:
    t = re.sub(r"[\t\n\r]+", " ", (texto or "").strip())
    t = re.sub(r" {4,}", "  ", t)
    if len(t) > 800:
        t = t[:797] + "..."
    return t


def texto_alerta_prueba() -> str:
    return (f"{SISTEMA_NOMBRE}: Tu numero de WhatsApp fue vinculado exitosamente. "
            "A partir de ahora recibiras tus alertas, reportes y recordatorios directamente en esta conversacion.")


def texto_alerta_matches(matches: list, hora_str: str = "") -> str:
    n = len(matches)
    cabecera = f"{SISTEMA_NOMBRE}: ALERTA - {n} nuevo(s) evento(s) detectado(s){hora_str} con tus keywords activas."
    partes = [f"{m['keyword']}: {m['titulo'][:50]} - Q{float(m['monto'] or 0):,.0f}" for m in matches[:6]]
    return cabecera + "  |  " + "  |  ".join(partes)


def texto_reporte_programado(total: int, keyword_text: str) -> str:
    return (f"{SISTEMA_NOMBRE}: REPORTE PROGRAMADO - {total} eventos exportados para "
            f"'{keyword_text[:35]}'. El archivo XLSX completo fue enviado a tu correo electronico.")


def texto_deadline(label: str, titulo: str, nog: str, entidad: str, monto=None) -> str:
    prefijo = "HOY" if label.upper() == "HOY" else f"en {label}"
    s = (f"{SISTEMA_NOMBRE}: RECORDATORIO - Vence {prefijo}: {titulo[:55]}. "
         f"| NOG: {nog} | Entidad: {entidad or 'N/A'}")
    if monto:
        s += f" | Monto: Q{float(monto):,.0f}"
    return s


async def enviar_whatsapp(telefono: str, mensaje: str, nombre_usuario: str = "Usuario") -> bool:
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        return False
    nombre = _limpiar(nombre_usuario or "Usuario")
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
                             "parameters": [
                                 {"type": "text", "text": nombre},
                                 {"type": "text", "text": texto},
                             ]}
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


async def registrar_telefono_proxy(phone: str, user_id: int) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10) as cl:
            resp = await cl.post(
                f"{PROXY_URL}/api/systems/register-phone",
                json={
                    "system_id": LICITRACK_SYSTEM_ID,
                    "phone": phone,
                    "internal_user_id": str(user_id),
                },
                headers={"X-API-Key": PROXY_API_KEY}
            )
        ok = resp.status_code < 400
        if ok:
            return True
        print(f"Proxy register-phone {phone} uid={user_id}: {resp.status_code} {resp.text[:150]}")
        return False
    except Exception as e:
        print(f"Proxy register-phone error {phone}: {e}")
        return False
