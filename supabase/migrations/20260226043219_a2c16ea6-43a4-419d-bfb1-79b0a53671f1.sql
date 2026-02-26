
-- Tabela de planejamentos
CREATE TABLE public.planejamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id),
  sessoes_planejadas INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planejamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage planejamentos"
  ON public.planejamentos FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tabela de sessões realizadas
CREATE TABLE public.planejamento_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planejamento_id UUID NOT NULL REFERENCES public.planejamentos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planejamento_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage planejamento_sessoes"
  ON public.planejamento_sessoes FOR ALL
  USING (true)
  WITH CHECK (true);
