import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";

function formatMessageTime(createdAt) {
  const d = new Date(createdAt.replace(" ", "T") + "Z");
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState({ team: null, direct: [] });
  const [activeKey, setActiveKey] = useState("team");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingThread, setLoadingThread] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
    } catch {
      // silencioso: a lista principal ja mostra erro de thread se necessario
    }
  }, []);

  const loadThread = useCallback(async (key) => {
    try {
      const res = await api.get("/messages/thread", { params: { with: key } });
      setMessages(res.data.messages);
      setError("");
    } catch {
      setError("Não foi possível carregar as mensagens.");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, 6000);
    return () => clearInterval(id);
  }, [loadConversations]);

  useEffect(() => {
    setLoadingThread(true);
    loadThread(activeKey);
    const id = setInterval(() => loadThread(activeKey), 3000);
    return () => clearInterval(id);
  }, [activeKey, loadThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    setSending(true);
    setError("");
    try {
      await api.post("/messages", {
        recipient_id: activeKey === "team" ? null : Number(activeKey),
        body,
      });
      setText("");
      await loadThread(activeKey);
      loadConversations();
    } catch (err) {
      setError(err?.response?.data?.error || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  const activeName =
    activeKey === "team"
      ? "Chat da equipe"
      : conversations.direct.find((d) => d.key === activeKey)?.name || "Conversa";

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      <AppHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-4 min-h-0">
        <aside className="md:w-64 w-full shrink-0 bg-surface border border-border rounded-xl flex flex-col min-h-0 max-h-48 md:max-h-none">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-ink">Conversas</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.team && (
              <ConversationItem
                active={activeKey === "team"}
                name="Chat da equipe"
                preview={conversations.team.lastMessage?.body}
                unread={conversations.team.unreadCount}
                onClick={() => setActiveKey("team")}
              />
            )}
            {conversations.direct.map((c) => (
              <ConversationItem
                key={c.key}
                active={activeKey === c.key}
                name={c.name}
                preview={c.lastMessage?.body}
                unread={c.unreadCount}
                onClick={() => setActiveKey(c.key)}
              />
            ))}
          </div>
        </aside>

        <section className="flex-1 bg-surface border border-border rounded-xl flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-ink">{activeName}</h2>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingThread ? (
              <p className="text-sm text-muted">Carregando mensagens...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted text-center mt-8">Nenhuma mensagem ainda. Diga oi 👋</p>
            ) : (
              messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isMine={m.sender_id === user.id}
                  showSender={activeKey === "team"}
                />
              ))
            )}
          </div>

          {error && <p className="text-xs text-status-cancelada px-4 pb-1 shrink-0">{error}</p>}

          <form onSubmit={handleSend} className="border-t border-border p-3 flex gap-2 shrink-0">
            <input
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Escreva uma mensagem..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-60"
            >
              Enviar
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function ConversationItem({ active, name, preview, unread, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/60 transition ${
        active ? "bg-primary-light" : "hover:bg-bg"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium truncate ${active ? "text-primary-dark" : "text-ink"}`}>
          {name}
        </span>
        {unread > 0 && (
          <span className="h-5 min-w-[20px] px-1 rounded-full bg-status-cancelada text-white text-[10px] leading-5 text-center shrink-0">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
      {preview && <p className="text-xs text-muted truncate mt-0.5">{preview}</p>}
    </button>
  );
}

function MessageBubble({ message, isMine, showSender }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-xl px-3 py-2 ${
          isMine ? "bg-primary text-white" : "bg-bg text-ink border border-border"
        }`}
      >
        {showSender && !isMine && (
          <p className="text-[11px] font-semibold text-primary mb-0.5">{message.sender_name}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        <p className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-muted"}`}>
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
