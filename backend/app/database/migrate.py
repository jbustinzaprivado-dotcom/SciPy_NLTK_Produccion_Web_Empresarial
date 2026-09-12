"""Run with python -m app.database.migrate from backend/."""
from pathlib import Path
from hashlib import sha256
from app.database.connection import connect


def migrate():
    directory = Path(__file__).resolve().parents[3] / "database"
    with connect() as connection:
        connection.execute("SELECT pg_advisory_xact_lock(2026090502)")
        connection.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())")
        # Contacto existed locally before upstream used versions 004/005.
        # Relabel only an exact content match; preserve checksum validation otherwise.
        for old, new in (("004_schema.sql", "009_schema.sql"), ("005_schema.sql", "010_schema.sql")):
            expected = sha256((directory / new).read_text(encoding="utf-8").encode()).hexdigest()
            previous = connection.execute("SELECT checksum FROM schema_migrations WHERE version = %s", (old,)).fetchone()
            if previous and previous["checksum"] == expected:
                connection.execute("UPDATE schema_migrations SET version = %s WHERE version = %s", (new, old))
        for path in sorted(directory.glob("[0-9][0-9][0-9]_schema.sql")):
            sql = path.read_text(encoding="utf-8")
            checksum = sha256(sql.encode()).hexdigest()
            existing = connection.execute("SELECT checksum FROM schema_migrations WHERE version = %s", (path.name,)).fetchone()
            if existing:
                if existing["checksum"] != checksum:
                    raise RuntimeError(f"Migración aplicada modificada: {path.name}")
                continue
            connection.execute(sql)
            connection.execute("INSERT INTO schema_migrations(version, checksum) VALUES (%s, %s)", (path.name, checksum))
            print(f"Aplicada: {path.name}")


if __name__ == "__main__":
    migrate()
