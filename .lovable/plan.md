

# Retorno Automatico de Pacientes

## Resumo
Adicionar campo "Dias para retorno" nos procedimentos. Ao agendar, o sistema cria automaticamente um segundo agendamento (retorno) no futuro, com base nos dias configurados. Se o retorno cair num domingo, sera movido para segunda-feira.

## Etapas

### 1. Migracao do Banco de Dados
- Adicionar coluna `dias_retorno` (integer, nullable) na tabela `procedimentos`
- Quando preenchido, indica em quantos dias o paciente deve retornar apos o procedimento

### 2. Pagina Financeiro -- Aba "Precos de Referencia"
- Adicionar uma terceira coluna editavel inline "Retorno (dias)" ao lado de "Duracao", seguindo o mesmo padrao visual ja existente (icone + valor + botao editar)
- Permitir salvar o numero de dias para retorno de cada procedimento

### 3. Pagina Agenda -- Criacao Automatica de Retorno
- Ao salvar um novo agendamento com sucesso, verificar se o procedimento selecionado tem `dias_retorno` configurado
- Se sim, calcular a data de retorno: data do agendamento + dias_retorno
- Se a data calculada cair num domingo (dia 0), mover para segunda-feira (dia + 1)
- Criar automaticamente um segundo agendamento com:
  - Mesmo paciente
  - Mesmo procedimento
  - Mesma duracao
  - Mesmo horario
  - Observacao: "Retorno automatico"
- Exibir toast informando que o retorno foi agendado e em qual data
- Se houver conflito de horario no dia do retorno, ainda assim criar o agendamento (o usuario pode ajustar depois), mas avisar no toast

### 4. Edicao -- Sem retorno automatico
- Ao editar um agendamento existente, nao criar retorno automatico (apenas na criacao)

## Detalhes Tecnicos
- SQL: `ALTER TABLE procedimentos ADD COLUMN dias_retorno integer;`
- Calculo da data de retorno no frontend:
  ```text
  const retornoDate = new Date(dataAgendamento);
  retornoDate.setDate(retornoDate.getDate() + dias_retorno);
  if (retornoDate.getDay() === 0) retornoDate.setDate(retornoDate.getDate() + 1);
  ```
- O fetch de procedimentos na Agenda sera atualizado para incluir `dias_retorno`
- Novo estado `editingRetorno` / `retornoValue` no Financeiro, seguindo o padrao de `editingDuracao`

