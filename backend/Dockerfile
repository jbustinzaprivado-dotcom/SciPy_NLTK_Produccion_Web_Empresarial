FROM python:3.12-slim
WORKDIR /workspace/backend
# opencv-python-headless necesita esta libreria del sistema para poder importarse
RUN apt-get update && apt-get install -y --no-install-recommends libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Descarga los datos de NLTK (stopwords, tokenizador) durante el build,
# para no depender de que el servidor los tenga instalados manualmente.
RUN python -m nltk.downloader stopwords punkt punkt_tab
COPY backend/app ./app
COPY database /workspace/database
CMD ["sh", "-c", "python -m app.database.migrate && uvicorn app.main:app --host 0.0.0.0 --port 8000"]