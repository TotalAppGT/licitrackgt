from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/noninog"
    SECRET_KEY: str = "cambiar-en-produccion-clave-segura-123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    RECURRENTE_SECRET_KEY: str = "sk_test_d4KdJ1bqY0V2VLxHZGmpJOejzU2AYQIIgQnf6BosJnxldKp5i5ljHCuT"
    RECURRENTE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "LiciTrackGT <no-reply@totalappgt.online>"
    RESEND_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
