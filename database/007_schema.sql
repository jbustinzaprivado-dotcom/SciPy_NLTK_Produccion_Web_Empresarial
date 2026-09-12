CREATE TABLE optimizaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    parametros_entrada JSONB NOT NULL,
    resultado JSONB,
    costo_inicial NUMERIC(14,4),
    costo_optimizado NUMERIC(14,4),
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);