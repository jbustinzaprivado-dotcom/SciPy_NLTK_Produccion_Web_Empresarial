-- Agregar columnas para el login con reconocimiento facial (opcionales)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS face_image TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS face_vector TEXT;