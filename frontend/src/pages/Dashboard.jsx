import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";
import FilterBar from "../components/FilterBar.jsx";
import PriorityFilter from "../components/PriorityFilter.jsx";
import KanbanBoard from "../components/KanbanBoard.jsx";
import Charts from "../components/Charts.jsx";
import TaskModal from "../components/TaskModal.jsx";
import { getRange, shiftDate, formatRangeLabel, toISODate } from "../utils/dateHelpers.js";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [scope, setScope] = useState("pessoal");
  const [periodType, setPeriodType] = useState("diaria");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [priorityFilter, setPriorityFilter] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const { start, end } = getRange(referenceDate, periodType);
  const rangeLabel = formatRangeLabel(referenceDate, periodType);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tasks", { params: { scope, period_type: periodType, start, end } });
      setTasks(res.data.tasks);
    } catch (err) {
      setErrorMsg("Não foi possível carregar as tarefas.");
    } finally {
      setLoading(false);
    }
  }, [scope, periodType, start, end]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    setPriorityFilter(null);
  }, [scope, periodType, start, end]);

  useEffect(() => {
    api.get("/users").then((res) => setTeamMembers(res.data.users.filter((u) => u.id !== user.id)));
  }, [user.id]);

  const visibleTasks = useMemo(
    () => (priorityFilter ? tasks.filter((t) => t.priority === priorityFilter) : tasks),
    [tasks, priorityFilter]
  );

  async function handleStatusChange(taskId, newStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      setErrorMsg("Não foi possível mover a tarefa.");
      loadTasks();
    }
  }

  async function handleSaveTask(form) {
    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, form);
    } else {
      await api.post("/tasks", form);
    }
    // Recarrega a partir da API: tarefas recorrentes podem gerar varias
    // ocorrencias que caem dentro do periodo/escopo visiveis agora.
    await loadTasks();
    setModalOpen(false);
    setEditingTask(null);
  }

  async function handleDeleteTask(task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;

    let deleteSeries = false;
    if (task.recurrence_id) {
      deleteSeries = window.confirm(
        "Esta tarefa faz parte de uma série recorrente. Clique OK para excluir TODAS as ocorrências da série, ou Cancelar para excluir apenas esta."
      );
    }

    try {
      await api.delete(`/tasks/${task.id}`, { params: deleteSeries ? { series: "true" } : {} });
      await loadTasks();
    } catch (err) {
      setErrorMsg("Não foi possível excluir a tarefa.");
    }
  }

  function openNewTaskModal() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <FilterBar
          periodType={periodType}
          onPeriodChange={setPeriodType}
          scope={scope}
          onScopeChange={setScope}
          rangeLabel={rangeLabel}
          onPrev={() => setReferenceDate((d) => shiftDate(d, periodType, -1))}
          onNext={() => setReferenceDate((d) => shiftDate(d, periodType, 1))}
          onToday={() => setReferenceDate(new Date())}
          onNewTask={openNewTaskModal}
          isAdmin={isAdmin}
        />

        {!loading && tasks.length > 0 && (
          <PriorityFilter tasks={tasks} activePriority={priorityFilter} onChange={setPriorityFilter} />
        )}

        {errorMsg && (
          <p className="text-xs text-status-cancelada mb-4">{errorMsg}</p>
        )}

        {loading ? (
          <p className="text-sm text-muted">Carregando tarefas...</p>
        ) : (
          <>
            <KanbanBoard
              tasks={visibleTasks}
              currentUserId={user.id}
              isAdmin={isAdmin}
              onStatusChange={handleStatusChange}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
            />
            <Charts tasks={visibleTasks} />
          </>
        )}
      </main>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultScope={scope}
          defaultPeriod={periodType}
          defaultDate={toISODate(new Date())}
          teamMembers={teamMembers}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}
