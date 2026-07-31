import httpx
from datetime import date
from app.database import async_session
from app.models import Licitacion, ExtractionLog

OCDS_BASE = "https://ocds.guatecompras.gt"

async def obtener_meses_disponibles():
    async with httpx.AsyncClient(timeout=30) as cl:
        r = await cl.get(f"{OCDS_BASE}/v1/releases/bulk")
        if r.status_code != 200: return []
        data = r.json()
        return data.get("months", [])

def parse_releases(data: dict) -> list:
    releases = []
    for seccion in ["tenders", "awards", "contracts"]:
        for item in data.get(seccion, []):
            r = item.get("release", item)
            releases.append(r)
    return releases

async def run_extraction(anio: int = None, mes: int = None):
    meses = await obtener_meses_disponibles()
    if not meses: return
    if anio: meses = [m for m in meses if m.get("year") == anio or m.get("anio") == anio]
    if mes: meses = [m for m in meses if m.get("month") == mes or m.get("mes") == mes]
    async with httpx.AsyncClient(timeout=120) as cl:
        for m in meses:
            y = m.get("year", m.get("anio"))
            mo = m.get("month", m.get("mes"))
            key = f"{y}-{mo}"
            try:
                resp = await cl.get(f"{OCDS_BASE}/v1/releases/bulk", params={"year": y, "month": mo})
                if resp.status_code != 200: continue
                data = resp.json()
                items = data if isinstance(data, list) else data.get("data", data.get("releases", []))
                if not items: continue
                count = 0
                async with async_session() as db:
                    for item in items:
                        release = item if isinstance(item, dict) else {}
                        tender = release.get("tender") or {}
                        buyer = release.get("buyer") or {}
                        nog = tender.get("id", "") or release.get("ocid", "")
                        if not nog: continue
                        try:
                            fp = (release.get("date", "") or "")[:10]
                            fecha_pub = date.fromisoformat(fp) if fp else None
                        except: fecha_pub = None
                        lic = Licitacion(
                            nog=nog, ocid=release.get("ocid", ""),
                            fecha_publicacion=fecha_pub,
                            titulo=tender.get("title", ""),
                            entidad_compradora=buyer.get("name", "") or tender.get("procuringEntity", {}).get("name", ""),
                            monto=float(tender.get("value", {}).get("amount", 0) or 0),
                            moneda=tender.get("value", {}).get("currency", "GTQ"),
                            estado=tender.get("status", ""),
                            categoria=tender.get("mainProcurementCategory", ""),
                            metodo=tender.get("procurementMethod", ""),
                            modalidad=tender.get("procurementMethodDetails", ""),
                            anio=y, mes=mo,
                        )
                        db.add(lic); count += 1
                        if count % 200 == 0: await db.flush()
                    await db.commit()
                    log = ExtractionLog(anio=y, mes=mo, records_count=count, status="completed")
                    db.add(log); await db.commit()
            except Exception as e:
                async with async_session() as db:
                    log = ExtractionLog(anio=y, mes=mo, records_count=0, status=f"error: {str(e)[:100]}")
                    db.add(log); await db.commit()
