-- Clear all linked data first
DELETE FROM agendamentos;
DELETE FROM entradas;
DELETE FROM tratamentos;

-- Clear old procedures
DELETE FROM procedimentos;

-- Insert new procedures
INSERT INTO procedimentos (nome) VALUES
('Dermoterapia capilar'),
('Dermoterapia celulite'),
('Dermoterapia Estria'),
('Dermoterapia Flacidez'),
('Dermoterapia gordura localizada'),
('Dermoterapia hipertrofia'),
('Dermoterapia papada'),
('Dermoterapia emagrecimento'),
('Dermoterapia lipedema'),
('Dermoterapia flancos'),
('Dermoterapia harmonização glútea'),
('Microagulhamento'),
('Hifu full face'),
('Hifu papada'),
('Hifu abdomen'),
('Hifu flancos'),
('Hifu braço'),
('Hifu coxas'),
('Bioestimulador de colágeno'),
('Limpeza de pele'),
('Harmonização glútea');