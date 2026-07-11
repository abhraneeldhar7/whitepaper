from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Whitepapper_FASTAPI"
    ENVIRONMENT: str = "DEVELOPMENT"
    CORS_ORIGINS: str = "http://localhost:3000"
    PUBLIC_SITE_URL: str = "http://localhost:3000"

    CLERK_SECRET_KEY: str
    CLERK_JWT_KEY: str
    CLERK_AUTHORIZED_PARTIES: str = "http://localhost:3000"
    CLERK_WEBHOOK_SIGNING_SECRET: str

    NEON_DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 300
    DB_ECHO: bool = False

    R2_ENDPOINT_URL: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    R2_PUBLIC_URL: str

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
