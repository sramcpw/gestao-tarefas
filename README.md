# Gestão Empresarial — Tarefas de Equipe e Pessoais

Sistema simples de gestão de tarefas (não é um ERP): cada funcionário faz login e
enxerga suas tarefas do dia, da semana, do mês ou do ano, em formato Kanban
(arrastar e soltar entre **Pendente → Concluída → Cancelada → Adiada**), com
gráficos de acompanhamento. Além do quadro de equipe, cada usuário tem um
espaço **Pessoal**, totalmente privado, para tarefas próprias.

## Estrutura do projeto

```
gestao-empresarial/
├── backend/     # API em Node.js + Express + SQLite (better-sqlite3)
└── frontend/    # React + Vite + Tailwind + Kanban (drag-and-drop) + gráficos (recharts)
```

## Novidades desta versão

- **Chat interno**: um "Chat da equipe" (canal geral, visível a todos) e
  conversas diretas 1-a-1 com qualquer colega, com contador de mensagens não
  lidas na barra lateral e um selo no menu "Chat" no topo. As mensagens
  atualizam automaticamente a cada poucos segundos (não é preciso recarregar
  a página).

## Novidades da versão anterior

- **Prioridade em cada tarefa**: Baixa, Média, Alta e **Urgente**. Aparece como
  etiqueta colorida no cartão e existe um filtro por prioridade (com
  contadores) acima do quadro Kanban, além de um gráfico de distribuição por
  prioridade. Dentro de cada coluna do Kanban, as tarefas urgentes/prioritárias
  aparecem primeiro.
- **Tarefas recorrentes**: ao criar uma tarefa nova, é possível marcar
  "Tornar recorrente" e escolher a cada quantos dias/semanas/meses/anos ela se
  repete (ex.: *toda terça* = semanal a cada 1 semana, usando o dia da semana
  da data escolhida; *todo dia 5* = mensal a cada 1 mês, usando o dia do mês
  da data escolhida) e, opcionalmente, uma data final. O sistema já gera as
  ocorrências futuras automaticamente (com um limite de segurança para não
  criar tarefas infinitas). Cartões recorrentes mostram um selo 🔁 com a
  frequência. Ao excluir uma ocorrência de uma série, você escolhe excluir só
  aquela ou a série inteira.
- A edição de recorrência (mudar a frequência depois de criada) não é
  suportada nesta versão — a recorrência só é definida na criação da tarefa.

## Regras de permissão (já implementadas na API)

- **Pessoal**: só o dono vê e edita. Ninguém mais tem acesso, nem o admin.
- **Equipe**: um funcionário comum só edita/exclui tarefas que **criou** ou que
  **foram atribuídas a ele**. Um usuário com papel `admin` enxerga e gerencia
  todas as tarefas de equipe (visão de gestor).
- Toda checagem de permissão acontece no backend (não só na tela), então a
  regra vale mesmo se alguém chamar a API diretamente.

## Pré-requisitos

- [Node.js](https://nodejs.org) versão 18 ou superior (inclui o `npm`)
- Nenhum banco de dados externo é necessário — o backend usa SQLite em um
  arquivo local (`backend/data.db`), criado automaticamente.

Para conferir se já tem o Node instalado, rode no terminal:

```bash
node -v
npm -v
```

## 1. Configurando o backend (API)

Abra um terminal na pasta `backend`:

```bash
cd backend
npm install
cp .env.example .env
```

Abra o arquivo `.env` gerado e, se quiser, troque o valor de `JWT_SECRET` por
qualquer texto aleatório (isso é o que assina os tokens de login).

Popule o banco com um usuário admin e dois funcionários de teste, além de
algumas tarefas de exemplo:

```bash
npm run seed
```

Isso cria estes usuários (todos com email/senha prontos para teste):

| Papel        | Email               | Senha    |
|--------------|----------------------|----------|
| admin        | admin@empresa.com    | admin123 |
| funcionário  | ana@empresa.com      | 123456   |
| funcionário  | bruno@empresa.com    | 123456   |

Agora suba a API:

```bash
npm start
```

Você deve ver `API rodando em http://localhost:4000`. Deixe esse terminal
aberto.

> Dica: use `npm run dev` em vez de `npm start` durante o desenvolvimento —
> ele reinicia o servidor automaticamente a cada alteração de arquivo.

## 2. Configurando o frontend (interface)

Abra **um novo terminal** (deixe a API rodando no outro) e vá até a pasta
`frontend`:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O terminal vai mostrar um endereço, geralmente:

```
http://localhost:5173
```

Abra esse endereço no navegador. Faça login com um dos usuários de teste
acima (ou crie uma nova conta pela própria tela de login).

## 3. Usando o sistema

- **Diário / Semanal / Mensal / Anual**: alterna o intervalo de datas exibido
  no quadro.
- **Pessoal / Equipe**: alterna entre suas tarefas privadas e as tarefas de
  equipe (visíveis conforme as regras de permissão acima).
- **‹ / ›**: navega para o período anterior/seguinte; clicar no texto do meio
  volta para "hoje".
- **+ Nova tarefa**: abre o formulário de criação (título, descrição, data,
  status, prioridade, período, escopo, responsável quando for tarefa de
  equipe, e a opção de recorrência).
- **Filtro de prioridade**: os botões acima do quadro (Todas / Urgente / Alta
  / Média / Baixa) filtram o Kanban e os gráficos pela prioridade escolhida.
- Arraste os cartões entre as colunas do Kanban para mudar o status
  rapidamente — a mudança é salva automaticamente na API. Dentro de cada
  coluna, os cartões ficam ordenados por prioridade.
- Cada cartão tem os links **editar** e **excluir** (só aparecem quando você
  tem permissão sobre aquela tarefa). Ao excluir uma tarefa recorrente, você
  escolhe entre excluir só aquela data ou toda a série.
- Os gráficos abaixo do quadro mostram a distribuição por status, por
  prioridade e a quantidade de tarefas por data, sempre referentes ao
  período/escopo/prioridade selecionados.

## Atualizando uma instalação já existente

Se você já tinha rodado uma versão anterior deste projeto (com o arquivo
`backend/data.db` já criado), não precisa apagar nada: basta substituir os
arquivos pelos desta pasta e rodar `npm start` (ou `npm run dev`) novamente —
o `backend/db.js` detecta colunas e tabelas novas (prioridade, recorrência,
chat) que ainda não existem e as cria/adiciona automaticamente, mantendo os
dados que já estavam lá.

## 4. Usando o chat

- Clique em **Chat** no topo da página (ao lado de "Tarefas"). Um número
  vermelho aparece ali quando existem mensagens não lidas.
- **Chat da equipe**: canal único visível a todos os funcionários — bom para
  avisos gerais.
- Clique no nome de um colega, na lista à esquerda, para abrir uma conversa
  direta só entre vocês dois.
- As mensagens são atualizadas automaticamente; não é necessário recarregar
  a página. Abrir uma conversa marca as mensagens dela como lidas.

## Comandos úteis (resumo)

```bash
# Backend
cd backend
npm install       # instala dependências
npm run seed      # cria usuários e tarefas de exemplo (rodar 1x)
npm run dev       # sobe a API com reinício automático
npm start         # sobe a API normalmente

# Frontend
cd frontend
npm install       # instala dependências
npm run dev       # sobe a interface em modo desenvolvimento
npm run build     # gera a versão de produção (pasta dist/)
npm run preview   # serve a versão de produção localmente
```

## Encerrando

Para parar cada serviço, volte ao terminal correspondente e pressione
`Ctrl + C`.

## Próximos passos sugeridos (opcional)

- Trocar `JWT_SECRET` por um valor forte antes de usar em produção.
- Hospedar o backend (ex.: Render, Railway, VPS) e o frontend (ex.: Vercel,
  Netlify), apontando `VITE_API_URL` para a URL pública da API.
- Trocar o SQLite por Postgres/MySQL se o time crescer muito — o `db.js`
  concentra todo o acesso a dados, então a migração fica isolada ali.
- Adicionar recuperação de senha e confirmação de email, hoje fora do escopo.
