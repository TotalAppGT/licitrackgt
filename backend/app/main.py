from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from pathlib import Path
import httpx

from app.config import settings
from app.database import init_db, get_db
from app.models import User, Licitacion, SubscriptionPlan, ExtractionLog, KeywordAlert
from app.auth import hash_password, verify_password, create_token, get_current_user

RECURRENTE_API = "https://app.recurrente.com/api"
RECURRENTE_PLANS = {
    "basico":  {"price_id": "price_lltzdrus", "name": "B\u00e1sico",  "price": 349, "keywords": 10,  "users": 1},
    "pro":     {"price_id": "price_kyqlcwp6", "name": "Pro",        "price": 599, "keywords": 50,  "users": 3},
    "enterprise": {"price_id": "price_n2pdn7xh", "name": "Enterprise","price": 999, "keywords": 999, "users": 10},
}

app = FastAPI(title="LiciTrackGT API", docs_url="/docs")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ============================================================
# SCHEMAS
# ============================================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""

# ============================================================
# AUTH ROUTES
# ============================================================
@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    token = create_token({"sub": user.email})
    return TokenResponse(access_token=token, user={
        "id": user.id, "email": user.email, "name": user.name,
        "is_admin": user.is_admin, "plan": user.subscription_plan
    })

@app.post("/api/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    user = User(email=req.email, password_hash=hash_password(req.password), name=req.name)
    db.add(user); await db.commit(); await db.refresh(user)
    token = create_token({"sub": user.email})
    return TokenResponse(access_token=token, user={
        "id": user.id, "email": user.email, "name": user.name, "plan": "free"
    })

@app.get("/api/auth/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name,
            "is_admin": user.is_admin, "plan": user.subscription_plan,
            "status": user.subscription_status}

# ============================================================
# DASHBOARD
# ============================================================
@app.get("/api/dashboard/stats")
async def dashboard_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Licitacion.id)))
    entidades = await db.scalar(select(func.count(func.distinct(Licitacion.entidad_compradora))))
    monto_prom = await db.scalar(select(func.avg(Licitacion.monto)).where(Licitacion.monto > 0)) or 0
    total_2026 = await db.scalar(select(func.count(Licitacion.id)).where(Licitacion.anio == 2026)) or 0
    top_entidades = (await db.execute(
        select(Licitacion.entidad_compradora, func.count().label("cnt"))
        .where(Licitacion.entidad_compradora != "")
        .group_by(Licitacion.entidad_compradora).order_by(text("cnt DESC")).limit(15)
    )).all()
    top_categorias = (await db.execute(
        select(Licitacion.categoria, func.count().label("cnt"))
        .where(Licitacion.categoria != "")
        .group_by(Licitacion.categoria).order_by(text("cnt DESC")).limit(10)
    )).all()
    meses_2026 = (await db.execute(
        select(Licitacion.mes, func.count().label("cnt"))
        .where(Licitacion.anio == 2026).group_by(Licitacion.mes).order_by(Licitacion.mes)
    )).all()
    por_mes = [{"mes": m, "cantidad": c} for m, c in meses_2026]
    por_departamento = (await db.execute(
        select(Licitacion.departamento, func.count().label("cnt"))
        .where(Licitacion.departamento != "").group_by(Licitacion.departamento)
        .order_by(text("cnt DESC")).limit(10)
    )).all()
    return {
        "total": total or 0, "entidades": entidades or 0,
        "monto_prom": round(float(monto_prom), 2), "total_2026": total_2026 or 0,
        "entidades_top": [{"nombre": r[0], "cantidad": r[1]} for r in top_entidades],
        "categorias_top": [{"nombre": r[0], "cantidad": r[1]} for r in top_categorias],
        "por_mes": por_mes,
        "por_departamento": [{"nombre": r[0], "cantidad": r[1]} for r in por_departamento],
    }

# ============================================================
# LICITACIONES
# ============================================================
class FiltrosQuery(BaseModel):
    estatus: Optional[str] = None
    categoria: Optional[str] = None
    entidad: Optional[str] = None
    texto: Optional[str] = None
    anio: Optional[int] = None
    mes: Optional[int] = None
    departamento: Optional[str] = None
    metodo: Optional[str] = None
    modalidad: Optional[str] = None
    fecha_desde: Optional[str] = None
    fecha_hasta: Optional[str] = None
    monto_min: Optional[float] = None
    monto_max: Optional[float] = None
    destinatario: Optional[str] = None
    destinatarios: Optional[str] = None
    page: int = 1
    per_page: int = 50

def _apply_filtros(q, f):
    if f.estatus: q = q.where(Licitacion.estado == f.estatus)
    if f.categoria: q = q.where(Licitacion.categoria == f.categoria)
    if f.entidad: q = q.where(Licitacion.entidad_compradora.ilike(f"%{f.entidad}%"))
    if f.texto: q = q.where(Licitacion.titulo.ilike(f"%{f.texto}%"))
    if f.anio: q = q.where(Licitacion.anio == f.anio)
    if f.mes: q = q.where(Licitacion.mes == f.mes)
    if f.departamento: q = q.where(Licitacion.departamento == f.departamento)
    if f.metodo: q = q.where(Licitacion.metodo == f.metodo)
    if f.modalidad: q = q.where(Licitacion.modalidad.ilike(f"%{f.modalidad}%"))
    if f.fecha_desde: q = q.where(Licitacion.fecha_publicacion >= f.fecha_desde)
    if f.fecha_hasta: q = q.where(Licitacion.fecha_publicacion <= f.fecha_hasta)
    if f.monto_min: q = q.where(Licitacion.monto >= f.monto_min)
    if f.monto_max: q = q.where(Licitacion.monto <= f.monto_max)
    return q

def _serialize(r):
    return [r.nog, r.ocid, str(r.fecha_publicacion) if r.fecha_publicacion else "",
            r.titulo or "", r.entidad_compradora or "", r.monto or 0, r.moneda or "GTQ",
            r.estado or "", r.categoria or "", r.metodo or "", r.modalidad or "",
            r.departamento or ""]

CSV_HEADERS = ["NOG", "OCID", "Fecha", "Titulo", "Entidad", "Monto", "Moneda",
               "Estado", "Categoria", "Metodo", "Modalidad", "Departamento"]

@app.post("/api/licitaciones")
async def query_licitaciones(f: FiltrosQuery, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = _apply_filtros(select(Licitacion), f)
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    offset = (f.page - 1) * f.per_page
    q = q.order_by(Licitacion.fecha_publicacion.desc()).offset(offset).limit(f.per_page)
    rows = (await db.execute(q)).scalars().all()
    return {"total": total or 0, "page": f.page, "data": [{
        "nog": r.nog, "ocid": r.ocid, "fecha": str(r.fecha_publicacion) if r.fecha_publicacion else "",
        "titulo": r.titulo, "entidad": r.entidad_compradora, "monto": r.monto or 0,
        "estado": r.estado, "categoria": r.categoria, "metodo": r.metodo,
        "modalidad": r.modalidad, "departamento": r.departamento
    } for r in rows]}

@app.post("/api/licitaciones/export")
async def export_licitaciones(f: FiltrosQuery, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import io, csv
    from fastapi.responses import StreamingResponse
    q = _apply_filtros(select(Licitacion), f)
    base = q.order_by(Licitacion.id)

    def rows_batches(batch=2000):
        last_id = 0
        while True:
            sub = base.where(Licitacion.id > last_id).limit(batch)
            batch_rows = (db.execute(sub)).scalars().all()
            if not batch_rows:
                break
            for r in batch_rows:
                yield r
            last_id = batch_rows[-1].id

    def stream_csv():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(CSV_HEADERS)
        yield buf.getvalue()
        buf = io.StringIO()
        writer = csv.writer(buf)
        for r in rows_batches():
            writer.writerow(_serialize(r))
            if buf.tell() > 1024 * 512:
                yield buf.getvalue()
                buf = io.StringIO()
                writer = csv.writer(buf)
        yield buf.getvalue()

    filename = f"licitaciones_{f.anio or 'todos'}_{f.mes or 'todos'}.csv"
    return StreamingResponse(stream_csv(), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})

@app.post("/api/licitaciones/export-xlsx")
async def export_licitaciones_xlsx(f: FiltrosQuery, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from io import BytesIO
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
    q = _apply_filtros(select(Licitacion), f)
    rows = (await db.execute(q.order_by(Licitacion.id))).scalars().all()
    wb = Workbook()
    ws = wb.active
    ws.title = "Licitaciones"
    header_fill = PatternFill("solid", fgColor="1A3A5C")
    header_font = Font(color="FFFFFF", bold=True)
    ws.append(CSV_HEADERS)
    for col_idx, _ in enumerate(CSV_HEADERS, start=1):
        c = ws.cell(row=1, column=col_idx)
        c.fill = header_fill
        c.font = header_font
        c.alignment = Alignment(horizontal="center")
    for r in rows:
        ws.append(_serialize(r))
    for col_idx, header in enumerate(CSV_HEADERS, start=1):
        max_len = max(len(str(header)), *(len(str(c.value or "")) for c in ws[get_column_letter(col_idx)][1:min(len(ws[get_column_letter(col_idx)]), 100)]))
        ws.column_dimensions[get_column_letter(col_idx)].width = min(max_len + 2, 60)
    ws.auto_filter.ref = ws.dimensions
    ws.freeze_panes = "A2"
    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)
    filename = f"licitaciones_{f.anio or 'todos'}_{f.mes or 'todos'}.xlsx"
    from fastapi.responses import Response
    return Response(content=bio.getvalue(),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename={filename}"})

@app.get("/api/licitaciones/opciones")
async def opciones_filtro(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    estados = (await db.execute(select(func.distinct(Licitacion.estado)).where(Licitacion.estado != ""))).scalars().all()
    categorias = (await db.execute(select(func.distinct(Licitacion.categoria)).where(Licitacion.categoria != ""))).scalars().all()
    departamentos = (await db.execute(select(func.distinct(Licitacion.departamento)).where(Licitacion.departamento != "").order_by(Licitacion.departamento))).scalars().all()
    metodos = (await db.execute(select(func.distinct(Licitacion.metodo)).where(Licitacion.metodo != ""))).scalars().all()
    modalidades = (await db.execute(select(func.distinct(Licitacion.modalidad)).where(Licitacion.modalidad != ""))).scalars().all()
    return {"estados": list(estados), "categorias": list(categorias),
            "departamentos": list(departamentos), "metodos": list(metodos),
            "modalidades": list(modalidades)}

@app.get("/api/licitaciones/meses")
async def meses_disponibles(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Licitacion.anio, Licitacion.mes).distinct())).all()
    meses = sorted({(r[0], r[1]) for r in rows if r[0]}, key=lambda x: (x[0], x[1]), reverse=True)
    return {"meses": [{"anio": y, "mes": m} for y, m in meses]}

@app.get("/api/licitaciones/opciones")
async def opciones_filtro(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    estados = (await db.execute(select(func.distinct(Licitacion.estado)).where(Licitacion.estado != ""))).scalars().all()
    categorias = (await db.execute(select(func.distinct(Licitacion.categoria)).where(Licitacion.categoria != ""))).scalars().all()
    return {"estados": list(estados), "categorias": list(categorias)}

# ============================================================
# RECURRENTE PAYMENTS
# ============================================================
class CreateCheckoutRequest(BaseModel):
    price_id: str

@app.post("/api/payments/create-checkout")
async def create_checkout(req: CreateCheckoutRequest, request: Request, user: User = Depends(get_current_user)):
    plan_key = None
    for k, v in RECURRENTE_PLANS.items():
        if v["price_id"] == req.price_id: plan_key = k; break
    if not plan_key:
        raise HTTPException(status_code=400, detail="Plan no valido")
    base = settings.FRONTEND_URL.rstrip("/") if settings.FRONTEND_URL else str(request.base_url).rstrip("/")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{RECURRENTE_API}/checkouts", headers={
                "X-SECRET-KEY": settings.RECURRENTE_SECRET_KEY,
                "Content-Type": "application/json",
            }, json={
                "items": [{"price_id": req.price_id, "quantity": 1}],
                "success_url": f"{base}/suscripcion?success=true",
                "cancel_url": f"{base}/suscripcion?canceled=true",
                "metadata": {"user_id": str(user.id), "plan": plan_key},
                "user_id": user.email,
            })
            data = resp.json()
            if resp.status_code != 201:
                raise HTTPException(status_code=400, detail=data.get("message", "Error al crear checkout"))
            return {"url": data["checkout_url"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payments/webhook")
async def recurrent_webhook(request: Request):
    import json, hmac, hashlib, time
    body = await request.body()
    try:
        event = json.loads(body)
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    if settings.RECURRENTE_WEBHOOK_SECRET:
        svix_id = request.headers.get("svix-id", "")
        svix_ts = request.headers.get("svix-timestamp", "")
        svix_sig = request.headers.get("svix-signature", "")
        secret = settings.RECURRENTE_WEBHOOK_SECRET.split("_", 1)[-1]
        import base64
        try:
            secret_bytes = base64.b64decode(secret)
        except Exception:
            secret_bytes = secret.encode()
        signed = f"{svix_id}.{svix_ts}.{body.decode('utf-8')}".encode()
        expected = hmac.new(secret_bytes, signed, hashlib.sha256).digest()
        parts = svix_sig.split(",")
        provided = base64.b64decode(parts[1]) if len(parts) > 1 else b""
        if not hmac.compare_digest(expected, provided):
            raise HTTPException(status_code=400, detail="Firma invalida")

    async def handle_event(data: dict):
        event_type = data.get("event_type", "") or data.get("type", "")
        checkout = data.get("checkout") or {}
        meta = data.get("metadata") or checkout.get("metadata") or {}
        user_id = meta.get("user_id") or checkout.get("user_id")
        plan = meta.get("plan", "pro")
        email = data.get("customer", {}).get("email", "")
        async with async_session() as db:
            user = None
            if user_id:
                try:
                    user = await db.get(User, int(user_id))
                except (TypeError, ValueError):
                    user = None
            if not user and email:
                result = await db.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
            if user:
                if event_type in ("subscription.create", "subscription.reactivate", "subscription.unpause"):
                    user.subscription_plan = plan
                    user.subscription_status = "active"
                    user.keywords_limit = RECURRENTE_PLANS.get(plan, {}).get("keywords", 50)
                elif event_type in ("subscription.cancel", "subscription.pause", "subscription.past_due"):
                    user.subscription_status = "inactive"
                await db.commit()
    try:
        await handle_event(event)
    except Exception as e:
        print(f"Webhook error: {e}")
    return {"ok": True}

@app.get("/api/payments/plans")
async def get_plans():
    return {"plans": [
        {"id": "free", "name": "Free", "price": 0, "keywords": 5, "users": 1},
        {"id": "basico",  "name": "B\u00e1sico",  "price": 349, "keywords": 10,  "users": 1,
         "stripe_price_id": RECURRENTE_PLANS["basico"]["price_id"]},
        {"id": "pro",     "name": "Pro",        "price": 599, "keywords": 50,  "users": 3,
         "stripe_price_id": RECURRENTE_PLANS["pro"]["price_id"]},
        {"id": "enterprise", "name": "Enterprise","price": 999, "keywords": 999, "users": 10,
         "stripe_price_id": RECURRENTE_PLANS["enterprise"]["price_id"]},
    ]}

# ============================================================
# STATIC FILES (Frontend SPA en produccion) - catch-all al FINAL
# ============================================================
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR / "static"), check_dir=False), name="static")

# ============================================================
# EXTRACTION
# ============================================================
@app.post("/api/extraction/start")
async def start_extraction(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Solo admin")
    from app.services.extractor_service import run_extraction
    import asyncio
    asyncio.create_task(run_extraction())
    return {"status": "started"}

@app.get("/api/extraction/logs")
async def extraction_logs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ExtractionLog).order_by(ExtractionLog.created_at.desc()).limit(20))).scalars().all()
    return {"logs": [{"anio": r.anio, "mes": r.mes, "records": r.records_count,
                      "status": r.status, "fecha": str(r.created_at)[:19]} for r in rows]}

@app.get("/api/extraction/status")
async def extraction_status(user: User = Depends(get_current_user)):
    from app.services.extractor_service import next_refresh_at, last_refresh_at
    return {
        "next_refresh_at": next_refresh_at.isoformat() + "Z" if next_refresh_at else None,
        "last_refresh_at": last_refresh_at.isoformat() + "Z" if last_refresh_at else None,
        "interval_hours": 6,
    }

# ============================================================
# ALERTAS (keywords) Y ENVIO POR CORREO
# ============================================================
class AlertRequest(BaseModel):
    keyword: str

@app.get("/api/alerts")
async def mis_alertas(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(KeywordAlert).where(KeywordAlert.user_id == user.id).order_by(KeywordAlert.id))).scalars().all()
    limite = RECURRENTE_PLANS.get(user.subscription_plan, {}).get("keywords", 5)
    return {"alerts": [{"id": a.id, "keyword": a.keyword} for a in rows], "limite": limite}

@app.post("/api/alerts")
async def crear_alerta(req: AlertRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    keyword = req.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword vacia")
    limite = RECURRENTE_PLANS.get(user.subscription_plan, {}).get("keywords", 5)
    count = await db.scalar(select(func.count()).select_from(KeywordAlert).where(KeywordAlert.user_id == user.id))
    if count >= limite:
        raise HTTPException(status_code=400, detail=f"Limite de {limite} keywords alcanzado para tu plan")
    exist = await db.scalar(select(KeywordAlert).where(KeywordAlert.user_id == user.id, KeywordAlert.keyword.ilike(keyword)))
    if exist:
        raise HTTPException(status_code=400, detail="Keyword ya registrada")
    alert = KeywordAlert(user_id=user.id, keyword=keyword)
    db.add(alert); await db.commit()
    return {"id": alert.id, "keyword": keyword}

@app.delete("/api/alerts/{alert_id}")
async def eliminar_alerta(alert_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.get(KeywordAlert, alert_id)
    if not row or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    await db.delete(row); await db.commit()
    return {"ok": True}

class EnviarCorreoRequest(BaseModel):
    destinatario: str = ""
    asunto: Optional[str] = None

@app.post("/api/licitaciones/enviar")
async def enviar_resultados(f: FiltrosQuery, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.subscription_plan == "free":
        raise HTTPException(status_code=403, detail="Funcion disponible en plan Basico o superior")
    q = _apply_filtros(select(Licitacion), f).limit(1000)
    rows = (await db.execute(q.order_by(Licitacion.fecha_publicacion.desc()))).scalars().all()
    if not rows:
        raise HTTPException(status_code=400, detail="No hay resultados para enviar")
    raw = (f.destinatarios or f.destinatario or user.email).strip()
    destinos = [d.strip() for d in raw.replace(";", ",").split(",") if d.strip()]
    validos = [d for d in destinos if "@" in d and "." in d]
    if not validos:
        raise HTTPException(status_code=400, detail="Correo(s) invalido(s)")
    titulo_filtro = f.texto or f"filtros ({len(rows)} resultados)"

    import io, csv
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(CSV_HEADERS)
    for r in rows:
        writer.writerow(_serialize(r))
    csv_bytes = buf.getvalue().encode("utf-8-sig")

    from io import BytesIO
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
    wb = Workbook()
    ws = wb.active
    ws.title = "Licitaciones"
    header_fill = PatternFill("solid", fgColor="1A3A5C")
    header_font = Font(color="FFFFFF", bold=True)
    ws.append(CSV_HEADERS)
    for col_idx, _ in enumerate(CSV_HEADERS, start=1):
        c = ws.cell(row=1, column=col_idx)
        c.fill = header_fill; c.font = header_font; c.alignment = Alignment(horizontal="center")
    for r in rows:
        ws.append(_serialize(r))
    for col_idx, header in enumerate(CSV_HEADERS, start=1):
        col = get_column_letter(col_idx)
        max_len = max(len(str(header)), *(len(str(c.value or "")) for c in ws[col][1:min(len(ws[col]), 100)]))
        ws.column_dimensions[col].width = min(max_len + 2, 60)
    ws.auto_filter.ref = ws.dimensions
    ws.freeze_panes = "A2"
    xbio = BytesIO()
    wb.save(xbio); xbio.seek(0)
    xlsx_bytes = xbio.getvalue()

    fila = "".join(
        f'<tr><td>{m["nog"]}</td><td>{m["fecha"]}</td><td><a href="https://guatecompras.gt/procesos/{m["nog"]}" style="color:#1a5fb4">{m["titulo"]}</a></td>'
        f'<td style="text-align:right">Q{float(m["monto"]):,.0f}</td><td>{m["entidad"]}</td></tr>'
        for m in rows[:80])
    html = f"""<div style="font-family:Arial;max-width:700px;margin:auto;color:#222">
        <h2 style="color:#1a3a5c">LiciTrackGT - {len(rows)} licitaciones</h2>
        <p>Filtro: <b>{titulo_filtro}</b></p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
            <tr style="background:#1a3a5c;color:#fff;text-align:left">
                <th>NOG</th><th>Fecha</th><th>Titulo</th><th>Monto</th><th>Entidad</th></tr>
            {fila}
        </table>
        <p style="margin-top:16px">Adjunto: <b>XLSX</b> con el detalle completo de {len(rows)} licitaciones.</p>
        <p><a href="{settings.FRONTEND_URL}" style="background:#1a3a5c;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Abrir LiciTrackGT</a></p>
        <p style="color:#888;font-size:12px">Recibes este correo por solicitud en tu cuenta.</p></div>"""

    from app.services.email_service import enviar_correo
    try:
        await enviar_correo(validos, f"LiciTrackGT: {len(rows)} licitaciones - {titulo_filtro[:50]}",
                            html, (f"licitaciones_{f.anio or 'todos'}_{f.mes or 'todos'}.xlsx",
                                   xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar correo: {str(e)[:200]}")
    return {"ok": True, "enviado_a": validos, "registros": len(rows)}

# ============================================================
# STARTUP
# ============================================================
@app.get("/api/debug/network", include_in_schema=False)
async def debug_network(user: User = Depends(get_current_user)):
    import socket
    result = {"smtp_host": settings.SMTP_HOST, "smtp_port": settings.SMTP_PORT,
              "smtp_user_configured": bool(settings.SMTP_USER)}
    for host, port in [("smtp.gmail.com", 587), ("smtp.gmail.com", 465), ("ocds.guatecompras.gt", 443)]:
        try:
            infos = socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
            result[f"{host}:{port}_dns"] = [i[4][0] for i in infos]
            s = socket.create_connection((host, port), timeout=8)
            s.close()
            result[f"{host}:{port}_connect"] = "OK"
        except Exception as e:
            result[f"{host}:{port}_connect"] = f"{type(e).__name__}: {e}"
    try:
        s = socket.create_connection(("142.250.141.108", 587), timeout=8)
        s.close()
        result["smtp_ipv4_connect"] = "OK"
    except Exception as e:
        result["smtp_ipv4_connect"] = f"{type(e).__name__}: {e}"
    return result

@app.on_event("startup")
async def startup():
    await init_db()
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == "totalappgt@gmail.com"))
        if not result.scalar_one_or_none():
            admin = User(email="totalappgt@gmail.com", password_hash=hash_password("admintotal"),
                         name="Admin", is_admin=True, is_active=True, subscription_plan="enterprise",
                         subscription_status="active", keywords_limit=999)
            db.add(admin); await db.commit()
            print("Admin creado: totalappgt@gmail.com / admintotal")
    import asyncio
    from app.services.extractor_service import background_auto_refresh
    asyncio.create_task(background_auto_refresh())
    print("LiciTrackGT API iniciada")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

from sqlalchemy.ext.asyncio import async_sessionmaker
from app.database import async_session

# ============================================================
# SPA CATCH-ALL (debe ir despues de todas las rutas API)
# ============================================================
if STATIC_DIR.exists():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        from fastapi.responses import FileResponse
        index = STATIC_DIR / "index.html"
        if not index.exists():
            return JSONResponse({"detail": "Frontend no construido"}, status_code=500)
        return FileResponse(str(index))
