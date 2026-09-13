from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from collections import Counter

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


def analizar_texto(texto: str) -> dict:
    """Desglose de un solo texto: total de tokens y sus palabras clave (sin stopwords)."""
    tokens = word_tokenize(texto.lower(), language="spanish")
    stop = set(stopwords.words("spanish"))
    palabras_clave = sorted({t for t in tokens if t.isalpha() and t not in stop})
    return {"total_tokens": len(tokens), "palabras_clave": palabras_clave}


def palabras_frecuentes(textos: list[str], top: int = 7) -> list[dict]:
    """Cuenta las palabras mas repetidas entre varios textos combinados."""
    texto_completo = " ".join(textos)
    if not texto_completo.strip():
        return []
    tokens = word_tokenize(texto_completo.lower(), language="spanish")
    stop = set(stopwords.words("spanish"))
    limpios = [t for t in tokens if t.isalpha() and t not in stop]
    frecuentes = Counter(limpios).most_common(top)
    return [{"palabra": pal, "frecuencia": frec} for pal, frec in frecuentes]

def explicar_categoria(texto: str, categoria: str | None) -> str:
    actual, _ = clasificar_texto(texto)
    if categoria != actual:
        return 'Categoría guardada en el registro; no se dispone del motivo original.'
    reglas = PALABRAS_RECLAMO if actual == 'reclamo' else PALABRAS_VENTAS if actual == 'ventas' else []
    coincidencias = [p for p in reglas if p in texto.lower()]
    if coincidencias:
        return 'Coincidencias en el asunto: ' + ', '.join(coincidencias) + '. Las reglas de reclamo tienen prioridad sobre ventas.'
    return 'Soporte por defecto: el asunto no coincide con las reglas de reclamo ni de ventas.'
