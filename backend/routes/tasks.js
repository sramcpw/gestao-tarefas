const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { generateOccurrenceDates, isValidRecurrenceRule } = require("../recurrence");

const router = express.Router();

const VALID_STATUS = ["pendente", "concluida", "cancelada", "adiada"];
const VALID_PERIOD = ["diaria", "semanal", "mensal", "anual"];
const VALID_SCOPE = ["pessoal", "equipe"];
const VALID_PRIORITY = ["baixa", "media", "alta", "urgente"];

function canEdit(task, user) {
  if (user.role === "admin") return true;
  return task.owner_id === user.id || task.assignee_id === user.id;
}

// GET /api/tasks?scope=pessoal|equipe&period_type=diaria&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/", authRequired, (req, res) => {
  const { scope, period_type, start, end } = req.query;
  const user = req.user;

  if (!scope || !VALID_SCOPE.includes(scope)) {
    return res.status(400).json({ error: "Parametro 'scope' invalido." });
  }
  if (!start || !end) {
    return res.status(400).json({ error: "Parametros 'start' e 'end' sao obrigatorios." });
  }

  let query = `SELECT t.*, o.name AS owner_name, a.name AS assignee_name
               FROM tasks t
               LEFT JOIN users o ON o.id = t.owner_id
               LEFT JOIN users a ON a.id = t.assignee_id
               WHERE t.scope = ? AND t.due_date BETWEEN ? AND ?`;
  const params = [scope, start, end];

  if (period_type && VALID_PERIOD.includes(period_type)) {
    query += " AND t.period_type = ?";
    params.push(period_type);
  }

  if (scope === "pessoal") {
    // Tarefas pessoais sao estritamente privadas: só o dono ve.
    query += " AND t.owner_id = ?";
    params.push(user.id);
  } else if (scope === "equipe" && user.role !== "admin") {
    // Funcionario ve apenas tarefas de equipe que criou ou que foram atribuidas a ele.
    query += " AND (t.owner_id = ? OR t.assignee_id = ?)";
    params.push(user.id, user.id);
  }
  // admin em 'equipe' ve tudo (visao de gestor)

  query += " ORDER BY t.due_date ASC, t.created_at ASC";

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// POST /api/tasks
router.post("/", authRequired, (req, res) => {
  const user = req.user;
  const {
    title,
    description,
    status,
    priority,
    period_type,
    scope,
    due_date,
    assignee_id,
    recurrence,
  } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: "Titulo e data sao obrigatorios." });
  }
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: "Status invalido." });
  }
  if (priority && !VALID_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: "Prioridade invalida." });
  }
  if (period_type && !VALID_PERIOD.includes(period_type)) {
    return res.status(400).json({ error: "Periodo invalido." });
  }
  if (scope && !VALID_SCOPE.includes(scope)) {
    return res.status(400).json({ error: "Escopo invalido." });
  }
  if (recurrence && !isValidRecurrenceRule(recurrence)) {
    return res.status(400).json({ error: "Regra de recorrencia invalida." });
  }

  const finalScope = scope || "pessoal";
  // Tarefa pessoal nunca pode ter um responsavel diferente do dono.
  const finalAssignee = finalScope === "equipe" ? (assignee_id || user.id) : user.id;
  const finalPriority = priority || "media";
  const finalStatus = status || "pendente";

  const insert = db.prepare(
    `INSERT INTO tasks
      (title, description, status, priority, period_type, scope, due_date, owner_id, assignee_id, recurrence_id, recurrence_rule)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let rootTask;
  let occurrencesCreated = 1;

  if (recurrence) {
    const dates = generateOccurrenceDates(due_date, recurrence);
    const recurrenceId = crypto.randomUUID();
    const recurrenceRuleJson = JSON.stringify({
      freq: recurrence.freq,
      interval: recurrence.interval || 1,
      until: recurrence.until || null,
    });

    const insertMany = db.transaction((allDates) => {
      let firstId = null;
      allDates.forEach((date, index) => {
        // A primeira ocorrencia usa o status escolhido pelo usuario; as futuras
        // comecam sempre como "pendente" (ainda nao aconteceram).
        const info = insert.run(
          title,
          description || "",
          index === 0 ? finalStatus : "pendente",
          finalPriority,
          period_type || "diaria",
          finalScope,
          date,
          user.id,
          finalAssignee,
          recurrenceId,
          recurrenceRuleJson
        );
        if (index === 0) firstId = info.lastInsertRowid;
      });
      return firstId;
    });

    const firstId = insertMany(dates);
    occurrencesCreated = dates.length;
    rootTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(firstId);
  } else {
    const info = insert.run(
      title,
      description || "",
      finalStatus,
      finalPriority,
      period_type || "diaria",
      finalScope,
      due_date,
      user.id,
      finalAssignee,
      null,
      null
    );
    rootTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  }

  res.status(201).json({ task: rootTask, occurrences_created: occurrencesCreated });
});

// PUT /api/tasks/:id  (edicao completa de uma unica ocorrencia)
router.put("/:id", authRequired, (req, res) => {
  const user = req.user;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);

  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  if (!canEdit(task, user)) {
    return res.status(403).json({ error: "Voce so pode editar suas proprias tarefas ou tarefas atribuidas a voce." });
  }

  const { title, description, status, priority, period_type, scope, due_date, assignee_id } = req.body;

  if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ error: "Status invalido." });
  if (priority && !VALID_PRIORITY.includes(priority)) return res.status(400).json({ error: "Prioridade invalida." });
  if (period_type && !VALID_PERIOD.includes(period_type)) return res.status(400).json({ error: "Periodo invalido." });
  if (scope && !VALID_SCOPE.includes(scope)) return res.status(400).json({ error: "Escopo invalido." });

  const finalScope = scope || task.scope;
  const finalAssignee = finalScope === "equipe" ? (assignee_id || task.assignee_id || task.owner_id) : task.owner_id;

  db.prepare(
    `UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?, period_type = ?, scope = ?,
      due_date = ?, assignee_id = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title || task.title,
    description ?? task.description,
    status || task.status,
    priority || task.priority,
    period_type || task.period_type,
    finalScope,
    due_date || task.due_date,
    finalAssignee,
    task.id
  );

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id);
  res.json({ task: updated });
});

// PATCH /api/tasks/:id/status  (usado pelo drag-and-drop do kanban)
router.patch("/:id/status", authRequired, (req, res) => {
  const user = req.user;
  const { status } = req.body;

  if (!status || !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: "Status invalido." });
  }

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  if (!canEdit(task, user)) {
    return res.status(403).json({ error: "Voce nao tem permissao para alterar esta tarefa." });
  }

  db.prepare("UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, task.id);
  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id);
  res.json({ task: updated });
});

// DELETE /api/tasks/:id?series=true  (series=true exclui todas as ocorrencias da recorrencia)
router.delete("/:id", authRequired, (req, res) => {
  const user = req.user;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);

  if (!task) return res.status(404).json({ error: "Tarefa nao encontrada." });
  if (!canEdit(task, user)) {
    return res.status(403).json({ error: "Voce nao tem permissao para excluir esta tarefa." });
  }

  if (req.query.series === "true" && task.recurrence_id) {
    const info = db.prepare("DELETE FROM tasks WHERE recurrence_id = ?").run(task.recurrence_id);
    return res.json({ ok: true, deleted: info.changes });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(task.id);
  res.json({ ok: true, deleted: 1 });
});

module.exports = router;
