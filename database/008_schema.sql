-- Agregar columna para almacenar el rostro en formato Base64 de forma opcional
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS face_image TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS face_image TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS face_vector TEXT;