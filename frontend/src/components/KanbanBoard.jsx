import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard.jsx";
import { priorityRank } from "../utils/priority.js";

const COLUMNS = [
  { key: "pendente", label: "Pendente", color: "border-t-status-pendente" },
  { key: "concluida", label: "Concluída", color: "border-t-status-concluida" },
  { key: "cancelada", label: "Cancelada", color: "border-t-status-cancelada" },
  { key: "adiada", label: "Adiada", color: "border-t-status-adiada" },
];

export default function KanbanBoard({ tasks, currentUserId, isAdmin, onStatusChange, onEdit, onDelete }) {
  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onStatusChange(Number(draggableId), destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks
            .filter((t) => t.status === col.key)
            .slice()
            .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.due_date.localeCompare(b.due_date));
          return (
            <div key={col.key} className={`bg-bg/60 rounded-xl border-t-4 ${col.color} p-3 min-h-[200px]`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-ink">{col.label}</h3>
                <span className="text-xs text-muted bg-surface border border-border rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] rounded-lg transition ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    {colTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                    {provided.placeholder}
                    {colTasks.length === 0 && (
                      <p className="text-xs text-muted/70 text-center py-6">Nenhuma tarefa</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
