import os


def database_url():
    value = os.environ.get("DATABASE_URL")
    if not value and os.environ.get("PGHOST"):
        return ""  # libpq reads PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD.
    if not value:
        raise RuntimeError("Configura DATABASE_URL antes de iniciar el backend.")
    return value
def secret_key() -> str:
    return os.environ.get("SECRET_KEY", "clave-de-desarrollo-cambiar-en-produccion")