const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// GET /api/users -> lista basica de colaboradores (para atribuir tarefas de equipe)
router.get("/", authRequired, (req, res) => {
  const users = db
    .prepare("SELECT id, name, email, role FROM users ORDER BY name ASC")
    .all();
  res.json({ users });
});

module.exports = router;
