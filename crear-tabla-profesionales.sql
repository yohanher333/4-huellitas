-- Crear tabla completa de profesionales
CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  specialty TEXT,
  experience_years INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Allow public read access" ON professionals FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users full access" ON professionals FOR ALL USING (auth.role() = 'authenticated');

-- Insertar profesionales de ejemplo
INSERT INTO professionals (id, name, photo_url, phone, email, specialty, experience_years, description) VALUES
('prof_001', 'Dr. García', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', '+57 300 123 4567', 'garcia@4huellitas.com', 'Veterinaria General', 8, 'Especialista en cuidado integral de mascotas con amplia experiencia en cortes y tratamientos estéticos.'),
('prof_002', 'Dra. Martínez', 'https://images.unsplash.com/photo-1594824375852-3c3c6d251267?w=400', '+57 300 765 4321', 'martinez@4huellitas.com', 'Estética Canina', 5, 'Experta en estilismo canino y tratamientos de belleza especializados para diferentes razas.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  photo_url = EXCLUDED.photo_url,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  specialty = EXCLUDED.specialty,
  experience_years = EXCLUDED.experience_years,
  description = EXCLUDED.description;