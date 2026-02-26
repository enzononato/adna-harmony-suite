
CREATE TABLE public.avisos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  texto TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage avisos"
  ON public.avisos
  FOR ALL
  USING (true)
  WITH CHECK (true);
