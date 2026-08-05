const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

const EPOCH = "0001-01-01 00:00:00";

function markRead(userId, conversationKey) {
  db.prepare(
    `INSERT INTO message_reads (user_id, conversation_key, last_read_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id, conversation_key) DO UPDATE SET last_read_at = excluded.last_read_at`
  ).run(userId, conversationKey);
}

function lastReadAt(userId, conversationKey) {
  const row = db
    .prepare("SELECT last_read_at FROM message_reads WHERE user_id = ? AND conversation_key = ?")
    .get(userId, conversationKey);
  return row ? row.last_read_at : EPOCH;
}

// GET /api/messages/conversations
// Lista o canal da equipe + uma conversa direta por colega, com previa e nao lidas.
router.get("/conversations", authRequired, (req, res) => {
  const me = req.user.id;
  const colleagues = db.prepare("SELECT id, name FROM users WHERE id != ? ORDER BY name ASC").all(me);

  const teamLastRead = lastReadAt(me, "team");
  const teamUnread = db
    .prepare("SELECT COUNT(*) AS c FROM messages WHERE recipient_id IS NULL AND sender_id != ? AND created_at > ?")
    .get(me, teamLastRead).c;
  const teamLastMessage = db
    .prepare(
      `SELECT m.body, m.created_at, m.sender_id, u.name AS sender_name
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.recipient_id IS NULL ORDER BY m.created_at DESC LIMIT 1`
    )
    .get();

  const direct = colleagues.map((c) => {
    const key = String(c.id);
    const lastRead = lastReadAt(me, key);
    const unreadCount = db
      .prepare("SELECT COUNT(*) AS c FROM messages WHERE sender_id = ? AND recipient_id = ? AND created_at > ?")
      .get(c.id, me, lastRead).c;
    const lastMessage = db
      .prepare(
        `SELECT body, created_at, sender_id FROM messages
         WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(me, c.id, c.id, me);
    return { key, id: c.id, name: c.name, lastMessage: lastMessage || null, unreadCount };
  });

  res.json({
    team: { key: "team", name: "Chat da equipe", lastMessage: teamLastMessage || null, unreadCount: teamUnread },
    direct,
  });
});

// GET /api/messages/thread?with=team|<userId>
// Retorna as mensagens da conversa e marca como lida para quem esta consultando.
router.get("/thread", authRequired, (req, res) => {
  const me = req.user.id;
  const withParam = req.query.with;

  if (!withParam) return res.status(400).json({ error: "Parametro 'with' e obrigatorio." });

  let messages;
  let conversationKey;

  if (withParam === "team") {
    conversationKey = "team";
    messages = db
      .prepare(
        `SELECT m.*, u.name AS sender_name FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.recipient_id IS NULL
         ORDER BY m.created_at ASC LIMIT 300`
      )
      .all();
  } else {
    const otherId = Number(withParam);
    if (!Number.isInteger(otherId)) return res.status(400).json({ error: "Parametro 'with' invalido." });

    const other = db.prepare("SELECT id FROM users WHERE id = ?").get(otherId);
    if (!other) return res.status(404).json({ error: "Usuario nao encontrado." });

    conversationKey = String(otherId);
    messages = db
      .prepare(
        `SELECT m.*, u.name AS sender_name FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
         ORDER BY m.created_at ASC LIMIT 300`
      )
      .all(me, otherId, otherId, me);
  }

  markRead(me, conversationKey);
  res.json({ messages });
});

// POST /api/messages  { recipient_id?: number|null, body: string }
router.post("/", authRequired, (req, res) => {
  const me = req.user.id;
  const { recipient_id, body } = req.body;

  const text = (body || "").trim();
  if (!text) return res.status(400).json({ error: "A mensagem nao pode ser vazia." });
  if (text.length > 2000) return res.status(400).json({ error: "Mensagem muito longa (limite de 2000 caracteres)." });

  let finalRecipient = null;
  if (recipient_id != null) {
    const rid = Number(recipient_id);
    if (!Number.isInteger(rid)) return res.status(400).json({ error: "Destinatario invalido." });
    const other = db.prepare("SELECT id FROM users WHERE id = ?").get(rid);
    if (!other) return res.status(404).json({ error: "Destinatario nao encontrado." });
    finalRecipient = rid;
  }

  const info = db
    .prepare("INSERT INTO messages (sender_id, recipient_id, body) VALUES (?, ?, ?)")
    .run(me, finalRecipient, text);

  const message = db
    .prepare(
      `SELECT m.*, u.name AS sender_name FROM messages m
       JOIN users u ON u.id = m.sender_id WHERE m.id = ?`
    )
    .get(info.lastInsertRowid);

  markRead(me, finalRecipient == null ? "team" : String(finalRecipient));

  res.status(201).json({ message });
});

module.exports = router;
