const PERIODS = [
  { key: "diaria", label: "Diário" },
  { key: "semanal", label: "Semanal" },
  { key: "mensal", label: "Mensal" },
  { key: "anual", label: "Anual" },
];

export default function FilterBar({
  periodType,
  onPeriodChange,
  scope,
  onScopeChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  onNewTask,
  isAdmin,
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg bg-surface border border-border p-1 text-sm font-medium">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`px-3 py-1.5 rounded-md transition ${
                periodType === p.key ? "bg-primary text-white" : "text-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-surface border border-border px-1 py-1">
          <button onClick={onPrev} className="h-7 w-7 rounded-md text-muted hover:bg-bg hover:text-ink transition" title="Anterior">
            ‹
          </button>
          <button onClick={onToday} className="px-2 h-7 text-xs font-medium text-muted hover:text-ink transition whitespace-nowrap">
            {rangeLabel}
          </button>
          <button onClick={onNext} className="h-7 w-7 rounded-md text-muted hover:bg-bg hover:text-ink transition" title="Próximo">
            ›
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex rounded-lg bg-surface border border-border p-1 text-sm font-medium">
          <button
            onClick={() => onScopeChange("pessoal")}
            className={`px-3 py-1.5 rounded-md transition ${
              scope === "pessoal" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            Pessoal
          </button>
          <button
            onClick={() => onScopeChange("equipe")}
            className={`px-3 py-1.5 rounded-md transition ${
              scope === "equipe" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            Equipe{isAdmin ? " (todos)" : ""}
          </button>
        </div>

        <button
          onClick={onNewTask}
          className="bg-accent hover:bg-accent-dark transition text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap"
        >
          + Nova tarefa
        </button>
      </div>
    </div>
  );
}
