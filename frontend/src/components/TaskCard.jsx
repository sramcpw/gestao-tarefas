import { Draggable } from "@hello-pangea/dnd";
import { priorityMeta } from "../utils/priority.js";
import { describeRecurrence } from "../utils/recurrence.js";

const STATUS_COLOR = {
  pendente: "bg-status-pendente",
  concluida: "bg-status-concluida",
  cancelada: "bg-status-cancelada",
  adiada: "bg-status-adiada",
};

export default function TaskCard({ task, index, currentUserId, isAdmin, onEdit, onDelete }) {
  const editable = isAdmin || task.owner_id === currentUserId || task.assignee_id === currentUserId;
  const priority = priorityMeta(task.priority);
  const recurrenceLabel = describeRecurrence(task.recurrence_rule);

  return (
    <Draggable draggableId={String(task.id)} index={index} isDragDisabled={!editable}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-surface border border-border rounded-xl p-3 mb-2.5 shadow-sm ${
            snapshot.isDragging ? "ring-2 ring-primary/40" : ""
          } ${editable ? "cursor-grab" : "cursor-default opacity-90"}`}
        >
          <div className="flex items-start gap-2">
            <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${STATUS_COLOR[task.status]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${priority.badgeClass}`}>
                  {priority.label}
                </span>
                {recurrenceLabel && (
                  <span className="text-[10px] text-muted px-1.5 py-0.5 rounded bg-bg border border-border" title={recurrenceLabel}>
                    🔁 {recurrenceLabel}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-ink leading-snug break-words">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted mt-1 line-clamp-2 break-words">{task.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-muted">
                  {task.due_date}
                  {task.scope === "equipe" && task.assignee_name ? ` · ${task.assignee_name}` : ""}
                </span>
                {editable && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(task)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      editar
                    </button>
                    <button
                      onClick={() => onDelete(task)}
                      className="text-[11px] text-status-cancelada hover:underline"
                    >
                      excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
