from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://smartedu:smartedu@localhost:5432/smartedu"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "CHANGE_ME_SUPER_SECRET"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_days: int = 7
    storage_root: str = "storage"
    telegram_bot_token: str = ""
    google_service_account_json: str = ""
    web_origin: str = "http://localhost:3000"
    cookie_secure: bool = False
    admin_emails: str = ""
    admin_usernames: str = ""
    bootstrap_admin_email: str = ""
    bootstrap_admin_name: str = "Platform Admin"

    moodle_base_url: str = "http://moodle.local"
    moodle_token: str = "CHANGE_ME"
    moodle_username: str = ""
    moodle_password: str = ""


settings = Settings()
