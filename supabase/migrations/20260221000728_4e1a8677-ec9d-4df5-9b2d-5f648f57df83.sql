
-- Procedures enum-like table
CREATE TABLE public.procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed procedures
INSERT INTO public.procedimentos (nome) VALUES
  ('Tratamento de manchas'),
  ('Limpeza de pele'),
  ('Flacidez facial'),
  ('Flacidez Corporal'),
  ('Lipo enzimática de papada'),
  ('Gordura localizada'),
  ('Celulite'),
  ('Redução de estrias'),
  ('Hipertrofia muscular'),
  ('Harmonização glútea'),
  ('Alopécia Capilar'),
  ('Alopécia na Barba');

ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read procedimentos" ON public.procedimentos FOR SELECT USING (true);

-- Financial entries (income from procedures only)
CREATE TABLE public.entradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_nome TEXT NOT NULL,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id),
  valor NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL DEFAULT 'Dinheiro',
  observacoes TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage entradas" ON public.entradas FOR ALL USING (true) WITH CHECK (true);

-- Financial exits (expenses)
CREATE TABLE public.saidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  observacoes TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage saidas" ON public.saidas FOR ALL USING (true) WITH CHECK (true);
