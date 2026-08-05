const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "data.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'funcionario', -- 'admin' | 'funcionario'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente',      -- pendente | concluida | cancelada | adiada
  priority TEXT NOT NULL DEFAULT 'media',       -- baixa | media | alta | urgente
  period_type TEXT NOT NULL DEFAULT 'diaria',   -- diaria | semanal | mensal | anual
  scope TEXT NOT NULL DEFAULT 'pessoal',        -- pessoal | equipe
  due_date TEXT NOT NULL,                       -- YYYY-MM-DD
  owner_id INTEGER NOT NULL,
  assignee_id INTEGER,
  recurrence_id TEXT,                           -- agrupa as ocorrencias de uma mesma serie recorrente
  recurrence_rule TEXT,                         -- JSON: { freq, interval, until }
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scope ON tasks(scope);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_id ON tasks(recurrence_id);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER,                         -- NULL = mensagem no canal geral da equipe
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id);

CREATE TABLE IF NOT EXISTS message_reads (
  user_id INTEGER NOT NULL,
  conversation_key TEXT NOT NULL,               -- 'team' ou o id do colega (como texto)
  last_read_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, conversation_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Migracao leve para bancos criados antes destas colunas existirem.
const existingColumns = db.prepare("PRAGMA table_info(tasks)").all().map((c) => c.name);

if (!existingColumns.includes("priority")) {
  db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'media'");
}
if (!existingColumns.includes("recurrence_id")) {
  db.exec("ALTER TABLE tasks ADD COLUMN recurrence_id TEXT");
}
if (!existingColumns.includes("recurrence_rule")) {
  db.exec("ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT");
}

module.exports = db;
