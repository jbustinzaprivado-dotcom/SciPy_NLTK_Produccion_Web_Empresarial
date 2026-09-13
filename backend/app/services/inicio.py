"""Initialize the database before accepting API requests in any deployment."""
import logging
from app.database.migrate import migrate
from app.database.connection import connect
from app.services.integrar_consultas import integrar_consultas


def preparar_datos():
    migrate()
    with connect() as db:
        count = integrar_consultas(db)
    logging.getLogger(__name__).info("Consultas antiguas integradas al iniciar: %s", count)
