
-- Drop existing permissive policies and replace with authenticated-only

-- agendamentos
DROP POLICY IF EXISTS "Anyone can manage agendamentos" ON public.agendamentos;
CREATE POLICY "Authenticated users can manage agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- entradas
DROP POLICY IF EXISTS "Anyone can manage entradas" ON public.entradas;
CREATE POLICY "Authenticated users can manage entradas" ON public.entradas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- paciente_arquivos
DROP POLICY IF EXISTS "Anyone can manage paciente_arquivos" ON public.paciente_arquivos;
CREATE POLICY "Authenticated users can manage paciente_arquivos" ON public.paciente_arquivos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- pacientes
DROP POLICY IF EXISTS "Anyone can manage pacientes" ON public.pacientes;
CREATE POLICY "Authenticated users can manage pacientes" ON public.pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- procedimentos
DROP POLICY IF EXISTS "Anyone can read procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "Anyone can update procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "Anyone can insert procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "Anyone can delete procedimentos" ON public.procedimentos;
CREATE POLICY "Authenticated users can manage procedimentos" ON public.procedimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- saidas
DROP POLICY IF EXISTS "Anyone can manage saidas" ON public.saidas;
CREATE POLICY "Authenticated users can manage saidas" ON public.saidas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tratamentos
DROP POLICY IF EXISTS "Anyone can manage tratamentos" ON public.tratamentos;
CREATE POLICY "Authenticated users can manage tratamentos" ON public.tratamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
