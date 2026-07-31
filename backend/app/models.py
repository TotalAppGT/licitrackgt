from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), default="")
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    subscription_plan = Column(String(50), default="free")
    subscription_status = Column(String(50), default="inactive")
    keywords_limit = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Licitacion(Base):
    __tablename__ = "licitaciones"
    id = Column(Integer, primary_key=True, index=True)
    nog = Column(String(100), unique=True, index=True, nullable=False)
    ocid = Column(String(100))
    fecha_publicacion = Column(Date)
    titulo = Column(Text)
    entidad_compradora = Column(String(500))
    monto = Column(Float, default=0)
    moneda = Column(String(10), default="GTQ")
    estado = Column(String(100))
    categoria = Column(String(100))
    metodo = Column(String(100))
    modalidad = Column(String(100))
    departamento = Column(String(200))
    anio = Column(Integer)
    mes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    stripe_price_id = Column(String(255))
    price_monthly = Column(Float)
    keywords_limit = Column(Integer, default=5)
    users_limit = Column(Integer, default=1)
    description = Column(Text)
    features = Column(Text)

class ExtractionLog(Base):
    __tablename__ = "extraction_logs"
    id = Column(Integer, primary_key=True, index=True)
    anio = Column(Integer)
    mes = Column(Integer)
    records_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KeywordAlert(Base):
    __tablename__ = "keyword_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    keyword = Column(String(255), nullable=False)
    hora_envio = Column(Integer)  # 0-23, null = inmediato
    dias_envio = Column(String(50), default="1,2,3,4,5")  # 1=Lun...7=Dom
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PipelineItem(Base):
    __tablename__ = "pipeline_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    nog = Column(String(100), index=True, nullable=False)
    titulo = Column(Text)
    entidad = Column(String(500))
    monto = Column(Float, default=0)
    fecha_publicacion = Column(Date)
    etapa = Column(String(50), default="deteccion")
    fecha_presentacion = Column(Date)
    monto_propuesto = Column(Float, default=0)
    probabilidad = Column(Integer, default=0)
    notas = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    hora = Column(Integer, default=8)
    dias = Column(String(50), default="1,2,3,4,5")
    enabled = Column(Boolean, default=True)
    recipients = Column(Text, default="")
    keywords = Column(Text, default="")
    anio = Column(Integer)
    mes = Column(Integer)
    ultimo_envio = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
