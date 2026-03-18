

## Aba "Planejamento" na ficha do paciente

### O que sera feito

Adicionar uma nova aba **Planejamento** ao lado de Historico, Anamnese e Arquivos. Nessa aba voce podera:

- Criar um plano para o paciente: escolher um procedimento (da lista de procedimentos cadastrados) e definir a quantidade total de sessoes planejadas
- Registrar sessoes realizadas (com data e observacoes opcionais)
- Visualizar o progresso de cada plano com uma barra de progresso (ex: 3/10 sessoes)
- Editar ou excluir planos

### Nova tabela no banco de dados

**planejamentos**
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | Identificador |
| paciente_id | uuid | Referencia ao paciente |
| procedimento_id | uuid | Referencia ao procedimento |
| sessoes_planejadas | integer | Total de sessoes previstas |
| observacoes | text (nullable) | Notas gerais do plano |
| created_at | timestamp | Data de criacao |

**planejamento_sessoes**
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | Identificador |
| planejamento_id | uuid | Referencia ao plano |
| data | date | Data da sessao realizada |
| notas | text (nullable) | Observacoes da sessao |
| created_at | timestamp | Data de criacao |

Ambas com RLS habilitado para usuarios autenticados.

### Alteracoes no codigo

**src/pages/Pacientes.tsx:**
1. Adicionar "planejamento" ao tipo `Tab` e incluir a aba no menu de abas
2. Buscar dados das tabelas `planejamentos`, `planejamento_sessoes` e `procedimentos` no `fetchData`
3. Renderizar a aba com:
   - Lista de planos do paciente, cada um mostrando o nome do procedimento, barra de progresso (sessoes feitas / planejadas), e lista das sessoes realizadas
   - Botao para adicionar novo plano (modal com select de procedimento + input de quantidade de sessoes)
   - Botao para registrar sessao realizada em cada plano (modal simples com data e notas)
   - Opcao de excluir plano

### Fluxo do usuario

1. Abre a ficha do paciente
2. Clica na aba "Planejamento"
3. Clica em "Novo Plano" - escolhe o procedimento e define quantas sessoes
4. A cada sessao realizada, clica em "Registrar Sessao" no plano correspondente
5. Acompanha o progresso visualmente pela barra de progresso

