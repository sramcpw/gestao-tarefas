import { useEffect, useState } from "react";
import { toISODate } from "../utils/dateHelpers.js";
import { PRIORITIES } from "../utils/priority.js";

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
  { value: "adiada", label: "Adiada" },
];
const PERIOD_OPTIONS = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
];
const FREQ_OPTIONS = [
  { value: "diaria", label: "dia(s)" },
  { value: "semanal", label: "semana(s)" },
  { value: "mensal", label: "mês(es)" },
  { value: "anual", label: "ano(s)" },
];

function weekdayName(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const names = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  return names[d.getDay()];
}

export default function TaskModal({ task, defaultScope, defaultPeriod, defaultDate, teamMembers, onClose, onSave }) {
  const isEditing = Boolean(task);

  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "pendente",
    priority: task?.priority || "media",
    period_type: task?.period_type || defaultPeriod || "diaria",
    scope: task?.scope || defaultScope || "pessoal",
    due_date: task?.due_date || defaultDate || toISODate(new Date()),
    assignee_id: task?.assignee_id || "",
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState({ freq: "semanal", interval: 1, until: "" });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateRecurrence(field, value) {
    setRecurrence((r) => ({ ...r, [field]: value }));
  }

  function recurrenceHint() {
    const interval = recurrence.interval || 1;
    if (recurrence.freq === "semanal") {
      return interval > 1
        ? `Repete a cada ${interval} semanas, sempre em uma ${weekdayName(form.due_date)}.`
        : `Repete toda ${weekdayName(form.due_date)}.`;
    }
    if (recurrence.freq === "diaria") {
      return interval > 1 ? `Repete a cada ${interval} dias.` : "Repete todos os dias.";
    }
    if (recurrence.freq === "mensal") {
      const day = form.due_date ? new Date(`${form.due_date}T00:00:00`).getDate() : "";
      return interval > 1 ? `Repete a cada ${interval} meses, sempre no dia ${day}.` : `Repete todo mês no dia ${day}.`;
    }
    return interval > 1 ? `Repete a cada ${interval} anos, na mesma data.` : "Repete todo ano, na mesma data.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isEditing && isRecurring) {
        payload.recurrence = {
          freq: recurrence.freq,
          interval: Number(recurrence.interval) || 1,
          until: recurrence.until || undefined,
        };
      }
      await onSave(payload);
    } catch (err) {
      setError(err?.response?.data?.error || "Não foi possível salvar a tarefa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-md p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ink mb-4">
          {isEditing ? "Editar tarefa" : "Nova tarefa"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted">Título</label>
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Descrição</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">Data</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={form.due_date}
                onChange={(e) => update("due_date", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Status</label>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">Prioridade</label>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Período</label>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={form.period_type}
                onChange={(e) => update("period_type", e.target.value)}
              >
                {PERIOD_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Escopo</label>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={form.scope}
              onChange={(e) => update("scope", e.target.value)}
            >
              <option value="pessoal">Pessoal</option>
              <option value="equipe">Equipe</option>
            </select>
          </div>

          {form.scope === "equipe" && (
            <div>
              <label className="text-xs font-medium text-muted">Responsável</label>
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={form.assignee_id}
                onChange={(e) => update("assignee_id", Number(e.target.value))}
              >
                <option value="">Eu mesmo</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {!isEditing && (
            <div className="border border-border rounded-lg p-3 bg-bg/50">
              <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-border"
                />
                Tornar recorrente
              </label>

              {isRecurring && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted whitespace-nowrap">A cada</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      value={recurrence.interval}
                      onChange={(e) => updateRecurrence("interval", e.target.value)}
                    />
                    <select
                      className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      value={recurrence.freq}
                      onChange={(e) => updateRecurrence("freq", e.target.value)}
                    >
                      {FREQ_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted">Repetir até (opcional)</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      value={recurrence.until}
                      min={form.due_date}
                      onChange={(e) => updateRecurrence("until", e.target.value)}
                    />
                  </div>

                  <p className="text-[11px] text-muted">
                    {recurrenceHint()}
                    {!recurrence.until && " Sem data final, geramos um período padrão de ocorrências automaticamente."}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-status-cancelada">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
