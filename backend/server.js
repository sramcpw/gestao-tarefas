require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const messageRoutes = require("./routes/messages");

if (!process.env.JWT_SECRET) {
  console.error("ERRO: defina JWT_SECRET no arquivo .env (veja .env.example).");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);

app.use((req, res) => res.status(404).json({ error: "Rota nao encontrada." }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
