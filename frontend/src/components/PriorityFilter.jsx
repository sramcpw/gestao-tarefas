import { PRIORITIES } from "../utils/priority.js";

export default function PriorityFilter({ tasks, activePriority, onChange }) {
  const counts = Object.fromEntries(PRIORITIES.map((p) => [p.key, 0]));
  tasks.forEach((t) => {
    if (counts[t.priority] != null) counts[t.priority] += 1;
  });

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-xs font-medium text-muted mr-1">Prioridade:</span>
      <button
        onClick={() => onChange(null)}
        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
          activePriority === null
            ? "bg-ink text-white border-ink"
            : "bg-surface text-muted border-border hover:text-ink"
        }`}
      >
        Todas ({tasks.length})
      </button>
      {PRIORITIES.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(activePriority === p.key ? null : p.key)}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
            activePriority === p.key ? p.activeClass : `${p.badgeClass} opacity-70 hover:opacity-100`
          }`}
        >
          {p.label} ({counts[p.key]})
        </button>
      ))}
    </div>
  );
}
