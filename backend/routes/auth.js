const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, email e senha sao obrigatorios." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "Ja existe um usuario com esse email." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const finalRole = role === "admin" ? "admin" : "funcionario";

  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(name, email, passwordHash, finalRole);

  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha sao obrigatorios." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email ou senha invalidos." });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = signToken(safeUser);

  res.json({ user: safeUser, token });
});

// GET /api/auth/me
router.get("/me", authRequired, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: "Usuario nao encontrado." });
  res.json({ user });
});

module.exports = router;
