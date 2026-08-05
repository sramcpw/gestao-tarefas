import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Nao foi possivel continuar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white font-display font-semibold text-lg mb-3">
            GE
          </div>
          <h1 className="text-xl font-semibold text-ink">Gestão Empresarial</h1>
          <p className="text-sm text-muted mt-1">Suas tarefas, do jeito certo, no dia certo.</p>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
          <div className="flex mb-5 rounded-lg bg-bg p-1 text-sm font-medium">
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === "login" ? "bg-surface shadow-sm text-ink" : "text-muted"}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === "register" ? "bg-surface shadow-sm text-ink" : "text-muted"}`}
              onClick={() => setMode("register")}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-muted">Nome</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Senha</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-xs text-status-cancelada">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary hover:bg-primary-dark transition text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
            >
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted text-center mt-4">
          Usuário de teste: admin@empresa.com / admin123
        </p>
      </div>
    </div>
  );
}
