CREATE TABLE auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    accion VARCHAR(100) NOT NULL,
    tabla VARCHAR(100),
    registro_id BIGINT,
    detalles JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);