import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const isChat = location.pathname.startsWith("/chat");

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await api.get("/messages/conversations");
        if (!active) return;
        const total = res.data.team.unreadCount + res.data.direct.reduce((sum, d) => sum + d.unreadCount, 0);
        setUnread(total);
      } catch {
        // silencioso: badge apenas cosmetico
      }
    }

    poll();
    const id = setInterval(poll, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center font-display font-semibold text-sm">
            GE
          </div>
          <div>
            <p className="text-sm font-semibold text-ink leading-none">Gestão Empresarial</p>
            <p className="text-xs text-muted mt-0.5">Olá, {user.name}</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-bg border border-border rounded-lg p-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              !isChat ? "bg-surface shadow-sm text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Tarefas
          </Link>
          <Link
            to="/chat"
            className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition ${
              isChat ? "bg-surface shadow-sm text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Chat
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-status-cancelada text-white text-[10px] leading-4 text-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </nav>

        <button onClick={logout} className="text-xs font-medium text-muted hover:text-ink transition">
          Sair
        </button>
      </div>
    </header>
  );
}
