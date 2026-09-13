-- Existing inbox entries remain available; new submissions link to the panel.
ALTER TABLE consultas_contacto
    ADD COLUMN comentario_id BIGINT UNIQUE REFERENCES comentarios(id),
    ADD COLUMN analisis JSONB;
