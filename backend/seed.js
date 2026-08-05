require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("./db");
const { generateOccurrenceDates } = require("./recurrence");

function upsertUser(name, email, password, role) {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return existing.id;

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(name, email, hash, role);
  return info.lastInsertRowid;
}

const adminId = upsertUser("Administrador", "admin@empresa.com", "admin123", "admin");
const anaId = upsertUser("Ana Souza", "ana@empresa.com", "123456", "funcionario");
const brunoId = upsertUser("Bruno Lima", "bruno@empresa.com", "123456", "funcionario");

console.log("Usuarios de teste:");
console.log("  admin@empresa.com / admin123 (admin)");
console.log("  ana@empresa.com   / 123456   (funcionario)");
console.log("  bruno@empresa.com / 123456   (funcionario)");

const today = new Date();
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function iso(date) {
  return date.toISOString().slice(0, 10);
}

const existingTasks = db.prepare("SELECT COUNT(*) AS c FROM tasks").get().c;

if (existingTasks === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO tasks
      (title, description, status, priority, period_type, scope, due_date, owner_id, assignee_id, recurrence_id, recurrence_rule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Cria uma tarefa (ou, se "recurrence" for informado, uma serie inteira de
  // ocorrencias) usando exatamente a mesma logica que a API usa quando o
  // usuario marca "Tornar recorrente" na tela — assim o banco de demonstracao
  // fica identico ao que seria gerado cadastrando manualmente.
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
    recurrence = null, // { freq: 'diaria'|'semanal'|'mensal', interval, untilOffsetDays }
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
          index === 0 ? status : "pendente", // ocorrencias futuras nascem pendentes
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

  // 30 cadastros de tarefas: 10 diarias, 10 semanais, 10 mensais.
  // Cada uma cobre uma prioridade (baixa/media/alta/urgente), um escopo
  // (pessoal/equipe) e alterna entre recorrente e nao recorrente.
  // Nas tarefas de equipe, o responsavel varia entre os tres usuarios de
  // teste para simular o time inteiro em atividade.
  const taskDefs = [
    // ---------- DIARIAS ----------
    { title: "Verificar e responder e-mails", priority: "baixa", period_type: "diaria", scope: "pessoal", owner: adminId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 13 } },
    { title: "Reunião diária da equipe (stand-up)", description: "Alinhamento rapido do que cada um vai fazer no dia.", priority: "alta", period_type: "diaria", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 6 } },
    { title: "Backup dos arquivos do dia", priority: "media", period_type: "diaria", scope: "equipe", owner: brunoId, assignee: brunoId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 20 } },
    { title: "Revisar tarefas pendentes de ontem", priority: "media", period_type: "diaria", scope: "pessoal", owner: anaId, dueOffsetDays: -1, status: "concluida" },
    { title: "Responder clientes urgentes", priority: "urgente", period_type: "diaria", scope: "equipe", owner: adminId, assignee: anaId, dueOffsetDays: 0 },
    { title: "Atualizar planilha de estoque", priority: "alta", period_type: "diaria", scope: "equipe", owner: brunoId, assignee: brunoId, dueOffsetDays: 1 },
    { title: "Alongamento e pausa ativa", priority: "baixa", period_type: "diaria", scope: "pessoal", owner: brunoId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 30 } },
    { title: "Conferir pagamentos do dia", priority: "urgente", period_type: "diaria", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 2 },
    { title: "Organizar mesa de trabalho", priority: "baixa", period_type: "diaria", scope: "pessoal", owner: anaId, dueOffsetDays: -2, status: "concluida" },
    { title: "Registrar ponto e horas trabalhadas", priority: "media", period_type: "diaria", scope: "pessoal", owner: adminId, dueOffsetDays: 0, recurrence: { freq: "diaria", interval: 1, untilOffsetDays: 30 } },

    // ---------- SEMANAIS ----------
    { title: "Enviar relatório semanal de vendas", priority: "alta", period_type: "semanal", scope: "equipe", owner: anaId, assignee: anaId, dueOffsetDays: 4, recurrence: { freq: "semanal", interval: 1, untilOffsetDays: 60 } },
    { title: "Reunião de alinhamento semanal", priority: "alta", period_type: "semanal", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 2, recurrence: { freq: "semanal", interval: 1, untilOffsetDays: 42 } },
    { title: "Planejar cardápio da semana", priority: "baixa", period_type: "semanal", scope: "pessoal", owner: anaId, dueOffsetDays: 0, recurrence: { freq: "semanal", interval: 1 } },
    { title: "Revisar métricas de desempenho", priority: "media", period_type: "semanal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 5 },
    { title: "Compras da semana", priority: "media", period_type: "semanal", scope: "pessoal", owner: brunoId, dueOffsetDays: -3, status: "concluida", recurrence: { freq: "semanal", interval: 1, untilOffsetDays: 60 } },
    { title: "Acompanhar chamados em aberto", priority: "urgente", period_type: "semanal", scope: "equipe", owner: brunoId, assignee: anaId, dueOffsetDays: 1 },
    { title: "Treinamento semanal da equipe", priority: "media", period_type: "semanal", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 6, status: "adiada" },
    { title: "Revisar contrato com fornecedor X", priority: "urgente", period_type: "semanal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 3 },
    { title: "Organizar arquivos pessoais da semana", priority: "baixa", period_type: "semanal", scope: "pessoal", owner: adminId, dueOffsetDays: 7 },
    { title: "Avaliar propostas recebidas", priority: "alta", period_type: "semanal", scope: "equipe", owner: anaId, assignee: brunoId, dueOffsetDays: -1, status: "cancelada" },

    // ---------- MENSAIS ----------
    { title: "Fechamento financeiro do mês", priority: "urgente", period_type: "mensal", scope: "equipe", owner: adminId, assignee: adminId, dueOffsetDays: 20, recurrence: { freq: "mensal", interval: 1 } },
    { title: "Pagamento de contas fixas", priority: "alta", period_type: "mensal", scope: "pessoal", owner: brunoId, dueOffsetDays: 5, recurrence: { freq: "mensal", interval: 1, untilOffsetDays: 180 } },
    { title: "Reunião mensal de resultados", priority: "alta", period_type: "mensal", scope: "equipe", owner: adminId, assignee: anaId, dueOffsetDays: 25, recurrence: { freq: "mensal", interval: 1 } },
    { title: "Planejamento de metas do próximo mês", priority: "media", period_type: "mensal", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 28 },
    { title: "Revisão de assinatura de serviços", priority: "baixa", period_type: "mensal", scope: "pessoal", owner: anaId, dueOffsetDays: 10, recurrence: { freq: "mensal", interval: 1, untilOffsetDays: 365 } },
    { title: "Auditoria interna de processos", priority: "urgente", period_type: "mensal", scope: "equipe", owner: brunoId, assignee: adminId, dueOffsetDays: 15 },
    { title: "Avaliação de desempenho da equipe", priority: "media", period_type: "mensal", scope: "equipe", owner: adminId, assignee: brunoId, dueOffsetDays: 22, status: "adiada" },
    { title: "Organizar backup mensal de documentos", priority: "media", period_type: "mensal", scope: "pessoal", owner: adminId, dueOffsetDays: -5, status: "concluida", recurrence: { freq: "mensal", interval: 1, untilOffsetDays: 365 } },
    { title: "Revisar orçamento pessoal", priority: "baixa", period_type: "mensal", scope: "pessoal", owner: brunoId, dueOffsetDays: 3 },
    { title: "Renovar certificações da equipe", priority: "alta", period_type: "mensal", scope: "equipe", owner: adminId, assignee: anaId, dueOffsetDays: 18, status: "cancelada" },
  ];

  taskDefs.forEach(insertTask);

  const totalRows = db.prepare("SELECT COUNT(*) AS c FROM tasks").get().c;
  console.log(`${taskDefs.length} tarefas cadastradas (diarias, semanais e mensais).`);
  console.log(`Como algumas sao recorrentes, o total de ocorrencias geradas no banco e ${totalRows}.`);
}

console.log("Seed concluido.");
