ALTER TABLE consultas_contacto
ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
CHECK (estado IN ('pendiente', 'en_atencion', 'atendida'));
