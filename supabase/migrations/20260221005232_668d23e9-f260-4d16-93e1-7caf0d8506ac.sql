-- Create storage bucket for patient files
INSERT INTO storage.buckets (id, name, public) VALUES ('paciente-arquivos', 'paciente-arquivos', true);

-- Allow anyone to read files
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'paciente-arquivos');

-- Allow anyone to upload files
CREATE POLICY "Allow upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'paciente-arquivos');

-- Allow anyone to delete files
CREATE POLICY "Allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'paciente-arquivos');

-- Table to track files per patient
CREATE TABLE public.paciente_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'application/pdf',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paciente_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage paciente_arquivos" ON public.paciente_arquivos FOR ALL USING (true) WITH CHECK (true);