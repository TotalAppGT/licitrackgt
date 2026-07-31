import httpx
from datetime import date
from app.database import async_session
from app.models import Licitacion, ExtractionLog
from app.config import settings

OCDS_BASE = "https://ocds.guatecompras.gt"

next_refresh_at = None
last_refresh_at = None

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
                        from sqlalchemy.dialects.postgresql import insert as pg_insert
                        from app.models import Licitacion as _L
                        stmt = pg_insert(_L).values(
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
                        ).on_conflict_do_update(
                            index_elements=[_L.nog],
                            set_={
                                "fecha_publicacion": stmt.excluded.fecha_publicacion,
                                "titulo": stmt.excluded.titulo,
                                "entidad_compradora": stmt.excluded.entidad_compradora,
                                "monto": stmt.excluded.monto,
                                "estado": stmt.excluded.estado,
                                "categoria": stmt.excluded.categoria,
                                "metodo": stmt.excluded.metodo,
                                "modalidad": stmt.excluded.modalidad,
                                "anio": stmt.excluded.anio,
                                "mes": stmt.excluded.mes,
                            }
                        )
                        await db.execute(stmt); count += 1
                        if count % 200 == 0: await db.flush()
                    await db.commit()
                    log = ExtractionLog(anio=y, mes=mo, records_count=count, status="completed")
                    db.add(log); await db.commit()
            except Exception as e:
                async with async_session() as db:
                    log = ExtractionLog(anio=y, mes=mo, records_count=0, status=f"error: {str(e)[:100]}")
                    db.add(log); await db.commit()

async def refresh_ultimo_mes():
    import asyncio
    from datetime import datetime
    ahora = datetime.utcnow()
    try:
        await run_extraction(anio=ahora.year, mes=ahora.month)
    except Exception as e:
        print(f"Auto-refresh fallo: {e}")

async def procesar_alertas():
    from sqlalchemy import select
    from app.models import User, KeywordAlert
    async with async_session() as db:
        alertas = (await db.execute(select(KeywordAlert))).scalars().all()
        usuarios = {}
        for a in alertas:
            usuarios.setdefault(a.user_id, []).append(a.keyword)
        if not usuarios:
            return
        from datetime import datetime
        ahora = datetime.utcnow()
        user_rows = (await db.execute(select(User).where(User.id.in_(list(usuarios.keys()))))).scalars().all()
        for u in user_rows:
            keywords = usuarios[u.id]
            if u.subscription_plan in ("free",) or u.subscription_status != "active":
                continue
            matches = []
            from app.models import Licitacion
            for kw in keywords:
                q = select(Licitacion).where(
                    Licitacion.titulo.ilike(f"%{kw}%"),
                    Licitacion.anio == ahora.year,
                    Licitacion.mes == ahora.month,
                ).limit(20)
                for r in (await db.execute(q)).scalars().all():
                    matches.append({"keyword": kw, "nog": r.nog, "titulo": r.titulo,
                                    "monto": r.monto or 0, "fecha": str(r.fecha_publicacion or "")})
            if matches:
                lista = "".join(
                    f'<li><b>{m["keyword"]}</b> - <a href="https://guatecompras.gt/procesos/{m["nog"]}">{m["titulo"]}</a> - Q{float(m["monto"]):,.0f} ({m["fecha"]})</li>'
                    for m in matches[:50])
                html = f"""<div style="font-family:Arial;max-width:600px;margin:auto">
                    <h2 style="color:#1a3a5c">LiciTrackGT - {len(matches)} alertas este mes</h2>
                    <p>Nuevas licitaciones que coinciden con tus keywords:</p>
                    <ul>{lista}</ul>
                    <p><a href="{settings.FRONTEND_URL}">Abrir LiciTrackGT</a></p>
                    <p style="color:#888;font-size:12px">Para dejar de recibir alertas, elimina la keyword en tu panel.</p></div>"""
                from app.services.email_service import enviar_correo
                try:
                    await enviar_correo([u.email], f"LiciTrackGT: {len(matches)} nuevas coincidencias", html)
                except Exception as e:
                    print(f"Error alerta para {u.email}: {e}")

async def background_auto_refresh():
    import asyncio
    from datetime import datetime, timedelta
    global next_refresh_at, last_refresh_at
    while True:
        try:
            await refresh_ultimo_mes()
            last_refresh_at = datetime.utcnow()
        except Exception as e:
            print(f"Auto-refresh error: {e}")
        try:
            await procesar_alertas()
        except Exception as e:
            print(f"Alertas error: {e}")
        next_refresh_at = datetime.utcnow() + timedelta(hours=6)
        await asyncio.sleep(6 * 3600)
