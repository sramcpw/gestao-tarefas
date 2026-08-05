require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

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

const today = new Date().toISOString().slice(0, 10);

const existingTasks = db.prepare("SELECT COUNT(*) AS c FROM tasks").get().c;
if (existingTasks === 0) {
  const insert = db.prepare(
    `INSERT INTO tasks (title, description, status, priority, period_type, scope, due_date, owner_id, assignee_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insert.run("Enviar relatorio semanal", "Consolidar numeros da semana e enviar para a diretoria.", "pendente", "alta", "semanal", "equipe", today, adminId, anaId);
  insert.run("Revisar contrato do fornecedor", "", "pendente", "urgente", "diaria", "equipe", today, adminId, brunoId);
  insert.run("Organizar agenda do mes", "", "concluida", "media", "mensal", "pessoal", today, anaId, anaId);
  insert.run("Planejamento anual de metas", "", "adiada", "media", "anual", "equipe", today, adminId, adminId);
  insert.run("Ler artigo sobre gestao de tempo", "", "pendente", "baixa", "diaria", "pessoal", today, brunoId, brunoId);

  console.log("Tarefas de exemplo criadas.");
}

console.log("Seed concluido.");
