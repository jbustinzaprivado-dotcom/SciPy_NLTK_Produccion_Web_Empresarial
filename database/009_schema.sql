CREATE TABLE consultas_contacto (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL CHECK (length(trim(nombre)) > 0),
    empresa VARCHAR(200) NOT NULL DEFAULT '',
    correo VARCHAR(200) NOT NULL,
    telefono VARCHAR(50) NOT NULL DEFAULT '',
    asunto TEXT NOT NULL CHECK (length(trim(asunto)) BETWEEN 10 AND 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
