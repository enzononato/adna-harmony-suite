
# Duracoes de Procedimentos e Blocos no Cronograma

## Resumo
Adicionar campo de **duracao** (em minutos) na tabela `procedimentos` -- funcionando igual ao campo de preco que ja existe. Ao agendar, o tempo vem pre-preenchido com base no procedimento selecionado, mas pode ser alterado. No cronograma diario, cada agendamento mostra o bloco de horario completo (ex: 14:00 - 15:30).

## Etapas

### 1. Migracao do Banco de Dados
- Adicionar coluna `duracao_minutos` (integer, nullable) na tabela `procedimentos`
- Adicionar coluna `duracao_minutos` (integer, nullable) na tabela `agendamentos` -- para salvar o tempo definido no momento do agendamento

### 2. Pagina Financeiro -- Aba "Precos de Referencia"
- Na aba de precos de referencia dos procedimentos, adicionar coluna "Duracao" ao lado de "Preco", permitindo editar e salvar a duracao em minutos para cada procedimento (mesmo padrao de edicao inline ja existente para preco)

### 3. Pagina Agenda -- Formulario de Novo Agendamento
- Adicionar campo "Duracao (min)" no modal de novo agendamento
- Ao selecionar um procedimento, preencher automaticamente o campo de duracao com o valor cadastrado na tabela `procedimentos` (mesmo comportamento que ja existe para o preco no financeiro)
- Permitir que o usuario altere o valor manualmente
- Salvar a duracao no campo `duracao_minutos` da tabela `agendamentos`

### 4. Pagina Agenda -- Formulario de Edicao
- Adicionar campo "Duracao (min)" no modal de edicao
- Carregar o valor salvo e permitir alteracao

### 5. Cronograma Diario
- Na listagem de compromissos do dia, exibir o horario de inicio e fim calculado (horario + duracao)
- Formato: "14:00 - 15:30" ao inves de apenas "14:00"
- Se nao houver duracao, exibir apenas o horario de inicio como hoje

## Detalhes Tecnicos
- Coluna `duracao_minutos` em `procedimentos`: `ALTER TABLE procedimentos ADD COLUMN duracao_minutos integer;`
- Coluna `duracao_minutos` em `agendamentos`: `ALTER TABLE agendamentos ADD COLUMN duracao_minutos integer;`
- Calculo do horario final no frontend: somar `duracao_minutos` ao `horario` para exibir o bloco
- Fetch de procedimentos na Agenda atualizado para incluir `duracao_minutos` junto com `id, nome`
- Auto-preenchimento ao selecionar procedimento no onChange do select (mesmo padrao do preco no Financeiro)
