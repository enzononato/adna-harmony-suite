
-- Junction table: multiple procedures per appointment
CREATE TABLE public.agendamento_procedimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Junction table: multiple procedures per financial entry
CREATE TABLE public.entrada_procedimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrada_id UUID NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.agendamento_procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrada_procedimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage agendamento_procedimentos"
ON public.agendamento_procedimentos FOR ALL
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage entrada_procedimentos"
ON public.entrada_procedimentos FOR ALL
USING (true) WITH CHECK (true);

-- Migrate existing data from single procedimento_id to junction tables
INSERT INTO public.agendamento_procedimentos (agendamento_id, procedimento_id)
SELECT id, procedimento_id FROM public.agendamentos WHERE procedimento_id IS NOT NULL;

INSERT INTO public.entrada_procedimentos (entrada_id, procedimento_id)
SELECT id, procedimento_id FROM public.entradas WHERE procedimento_id IS NOT NULL;

-- Make old columns nullable for backward compat
ALTER TABLE public.agendamentos ALTER COLUMN procedimento_id DROP NOT NULL;
ALTER TABLE public.entradas ALTER COLUMN procedimento_id DROP NOT NULL;
