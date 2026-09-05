CREATE TABLE categorias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categorias (nombre, descripcion) VALUES
    ('ventas', 'Consultas relacionadas a compras o cotizaciones'),
    ('soporte', 'Solicitudes de ayuda técnica o resolución de problemas'),
    ('reclamo', 'Quejas o insatisfacción con el servicio/producto'),
    ('consulta', 'Preguntas generales sobre la empresa o sus servicios'),
    ('felicitacion', 'Comentarios positivos o de agradecimiento'),
    ('otros', 'Comentarios que no encajan en las categorías anteriores');