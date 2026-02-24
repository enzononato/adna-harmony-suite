CREATE POLICY "Anyone can insert procedimentos" ON public.procedimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete procedimentos" ON public.procedimentos FOR DELETE USING (true);

INSERT INTO public.procedimentos (nome) VALUES ('Consulta capilar');