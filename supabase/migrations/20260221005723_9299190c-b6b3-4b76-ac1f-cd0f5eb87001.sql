CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_nome TEXT NOT NULL,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario TIME NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage agendamentos" ON public.agendamentos FOR ALL USING (true) WITH CHECK (true);