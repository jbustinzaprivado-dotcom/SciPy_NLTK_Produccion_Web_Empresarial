PALABRAS_RECLAMO = ["demora", "retraso", "queja", "reclamo", "mal", "pésimo", "lento", "error", "falla"]
PALABRAS_VENTAS = ["precio", "costo", "cotizar", "comprar", "planes", "licencias", "venta", "adquirir"]
PALABRAS_SOPORTE = ["ayuda", "problema", "computadora", "servidor", "acceso", "configurar", "soporte", "sistema"]


def clasificar_texto(texto: str) -> tuple[str, float]:
    msg = texto.lower()
    if any(p in msg for p in PALABRAS_RECLAMO):
        return "reclamo", 0.94
    if any(p in msg for p in PALABRAS_VENTAS):
        return "ventas", 0.91
    return "soporte", 0.86