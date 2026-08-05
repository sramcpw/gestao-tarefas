// Script complementar ao seed.js: SEMPRE roda (nao exige tabela vazia),
// entao pode ser usado quantas vezes quiser para engordar a base de
// demonstracao. Ele so pula se identificar que este lote especifico
// (identificado por um titulo-marcador) ja foi inserido antes, para nao
// duplicar as mesmas tarefas a cada execucao.
require("dotenv").config();
const crypto = require("crypto");
const db = require("./db");
const { generateOccurrenceDates } = require("./recurrence");

function getUserId(email) {
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!user) {
    console.error(`Usuario ${email} nao encontrado. Rode "npm run seed" primeiro para criar os usuarios de teste.`);
    process.exit(1);
  }
  return user.id;
}

const adminId = getUserId("admin@empresa.com");
const anaId = getUserId("ana@empresa.com");
const brunoId = getUserId("bruno@empresa.com");

// Marcador usado so para saber se este lote ja rodou antes.
const BATCH_MARKER = "Preparar apresentação para diretoria";
const alreadyRan = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE title = ?").get(BATCH_MARKER).c > 0;

if (alreadyRan) {
  console.log("Este lote extra de tarefas ja foi inserido antes — nada a fazer.");
  console.log('Se quiser gerar OUTRO lote novo, rode novamente com "node seed-more.js --force"');
  if (!process.argv.includes("--force")) {
    process.exit(0);
  }
}

const today = new Date();
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function iso(date) {
  return date.toISOString().slice(0, 10);
}

const insertStmt = db.prepare(`
  INSERT INTO tasks
    (title, description, status, priority, period_type, scope, due_date, owner_id, assignee_id, recurrence_id, recurrence_rule)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertTask({
  title,
  description = "",
  status = "pendente",
  priority = "media",
  period_type,
  scope,
  dueOffsetDays = 0,
  owner,
  assignee,
  recurrence = null,
}) {
  const ownerId = owner;
  const assigneeId = scope === "equipe" ? assignee || owner : owner;
  const dueDate = iso(addDays(today, dueOffsetDays));

  if (recurrence) {
    const until = recurrence.untilOffsetDays != null ? iso(addDays(today, recurrence.untilOffsetDays)) : undefined;
    const dates = generateOccurrenceDates(dueDate, {
      freq: recurrence.freq,
      interval: recurrence.interval || 1,
      until,
    });
    const recurrenceId = crypto.randomUUID();
    const recurrenceRuleJson = JSON.stringify({ freq: recurrence.freq, interval: recurrence.interval || 1, until: until || null });

    dates.forEach((date, index) => {
      insertStmt.run(
        title,
        description,
        index === 0 ? status : "pendente",
        priority,
        period_type,
        scope,
        date,
        ownerId,
        assigneeId,
        recurrenceId,
        recurrenceRuleJson
      );
    });
  } else {
    insertStmt.run(title, description, status, priority, period_type, scope, dueDate, ownerId, assigneeId, null, null);
  }
}

// Mais 30 tarefas (10 diarias, 10 semanais, 10 mensais), com titulos
// diferentes do primeiro lote, cobrindo de novo as quatro prioridades,
// pessoal/equipe e recorrente/nao recorrente.
const taskDefs = [
  // ---------- DIARIAS ----------
  { title: "Higienizar posto de trabalho", priority: "baixa", period_type: "diaria", scope: "pessoal", owner: brunoId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 15 } },
  { title: "Checar chamados de suporte", priority: "urgente", period_type: "diaria", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 10 } },
  { title: "Atualizar quadro de avisos", priority: "baixa", period_type: "diaria", scope: "equipe", owner: anaId, assignee: anaId, dueOffsetDays: 1 },
  { title: "Revisar agenda do dia seguinte", priority: "media", period_type: "diaria", scope: "pessoal", owner: adminId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 20 } },
  { title: "Conferir entregas do dia", priority: "alta", period_type: "diaria", scope: "equipe", owner: brunoId, assignee: brunoId, dueOffsetDays: 0 },
  { title: "Ler notícias do setor", priority: "baixa", period_type: "diaria", scope: "pessoal", owner: anaId, dueOffsetDays: -1, status: "concluida" },
  { title: "Resolver pendências urgentes de clientes", priority: "urgente", period_type: "diaria", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 1 },
  { title: "Atualizar status das tarefas no sistema", priority: "media", period_type: "diaria", scope: "pessoal", owner: brunoId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 25 } },
  { title: "Preparar café da manhã da equipe", priority: "baixa", period_type: "diaria", scope: "equipe", owner: anaId, assignee: brunoId, dueOffsetDays: 2, status: "adiada" },
  { title: "Fazer follow-up com leads do dia", priority: "alta", period_type: "diaria", scope: "equipe", owner: anaId, assignee: anaId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 12 } },

  // ---------- SEMANAIS ----------
  { title: "Preparar apresentação para diretoria", priority: "urgente", period_type: "semanal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 3, recurrence: { freq: "semanal", interval: 1, untilOffsetDays: 45 } },
  { title: "Organizar geladeira e copa", priority: "baixa", period_type: "semanal", scope: "equipe", owner: brunoId, assignee: anaId, dueOffsetDays: 6 },
  { title: "Revisar backlog de tarefas da equipe", priority: "alta", period_type: "semanal", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 2, recurrence: { freq: "semanal", interval: 1, untilOffsetDays: 56 } },
  { title: "Estudar novo curso online", priority: "baixa", period_type: "semanal", scope: "pessoal", owner: brunoId, dueOffsetDays: 0, recurrence: { freq: "semanal", interval: 1, untilOffsetDays: 70 } },
  { title: "Revisar despesas da semana", priority: "media", period_type: "semanal", scope: "pessoal", owner: adminId, dueOffsetDays: 5 },
  { title: "Alinhar prioridades com o time comercial", priority: "urgente", period_type: "semanal", scope: "equipe", owner: anaId, assignee: adminId, dueOffsetDays: 1 },
  { title: "Fazer manutenção preventiva dos equipamentos", priority: "media", period_type: "semanal", scope: "equipe", owner: brunoId, assignee: brunoId, dueOffsetDays: 4, recurrence: { freq: "semanal", interval: 2, untilOffsetDays: 90 } },
  { title: "Planejar refeições da semana", priority: "baixa", period_type: "semanal", scope: "pessoal", owner: anaId, dueOffsetDays: 0, status: "concluida" },
  { title: "Negociar prazos com fornecedores", priority: "alta", period_type: "semanal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: -2, status: "cancelada" },
  { title: "Atualizar site e redes sociais da empresa", priority: "media", period_type: "semanal", scope: "equipe", owner: anaId, assignee: anaId, dueOffsetDays: 7 },

  // ---------- MENSAIS ----------
  { title: "Revisar plano de metas trimestrais", priority: "alta", period_type: "mensal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 12, recurrence: { freq: "mensal", interval: 3 } },
  { title: "Pagar assinaturas e serviços recorrentes", priority: "alta", period_type: "mensal", scope: "pessoal", owner: anaId, dueOffsetDays: 8, recurrence: { freq: "mensal", interval: 1, untilOffsetDays: 200 } },
  { title: "Fazer inventário do estoque", priority: "urgente", period_type: "mensal", scope: "equipe", owner: brunoId, assignee: brunoId, dueOffsetDays: 27 },
  { title: "Revisar contratos de fornecedores", priority: "media", period_type: "mensal", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 14 },
  { title: "Organizar documentos fiscais do mês", priority: "urgente", period_type: "mensal", scope: "pessoal", owner: brunoId, dueOffsetDays: 6, recurrence: { freq: "mensal", interval: 1, untilOffsetDays: 300 } },
  { title: "Fazer retrospectiva mensal com o time", priority: "media", period_type: "mensal", scope: "equipe", owner: adminId, assignee: anaId, dueOffsetDays: 29, recurrence: { freq: "mensal", interval: 1 } },
  { title: "Planejar orçamento pessoal do mês", priority: "baixa", period_type: "mensal", scope: "pessoal", owner: adminId, dueOffsetDays: 2 },
  { title: "Atualizar cadastro de clientes", priority: "media", period_type: "mensal", scope: "equipe", owner: anaId, assignee: anaId, dueOffsetDays: 19, status: "adiada" },
  { title: "Revisar apólice de seguros", priority: "baixa", period_type: "mensal", scope: "pessoal", owner: anaId, dueOffsetDays: 16 },
  { title: "Consolidar indicadores do mês anterior", priority: "alta", period_type: "mensal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: -3, status: "concluida" },
];

taskDefs.forEach(insertTask);

const totalRows = db.prepare("SELECT COUNT(*) AS c FROM tasks").get().c;
console.log(`${taskDefs.length} tarefas adicionadas (diarias, semanais e mensais).`);
console.log(`Total de linhas de tarefas no banco agora: ${totalRows}.`);
