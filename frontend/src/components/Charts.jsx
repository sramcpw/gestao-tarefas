import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { PRIORITIES } from "../utils/priority.js";

const STATUS_META = [
  { key: "pendente", label: "Pendente", color: "#E1A32A" },
  { key: "concluida", label: "Concluída", color: "#2F9E6E" },
  { key: "cancelada", label: "Cancelada", color: "#D14D5B" },
  { key: "adiada", label: "Adiada", color: "#7C6FE0" },
];

const PRIORITY_COLOR = {
  urgente: "#DC2626",
  alta: "#D9822B",
  media: "#3D7DBF",
  baixa: "#8A90AD",
};

export default function Charts({ tasks }) {
  const pieData = STATUS_META.map((s) => ({
    name: s.label,
    value: tasks.filter((t) => t.status === s.key).length,
    color: s.color,
  }));

  const priorityData = PRIORITIES.map((p) => ({
    name: p.label,
    value: tasks.filter((t) => t.priority === p.key).length,
    color: PRIORITY_COLOR[p.key],
  }));

  const byDate = {};
  tasks.forEach((t) => {
    if (!byDate[t.due_date]) {
      byDate[t.due_date] = { date: t.due_date, pendente: 0, concluida: 0, cancelada: 0, adiada: 0 };
    }
    byDate[t.due_date][t.status] += 1;
  });
  const barData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  const hasTasks = tasks.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-ink mb-2">Distribuição por status</h3>
        {hasTasks ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-ink mb-2">Distribuição por prioridade</h3>
        {hasTasks ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E6F0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} width={56} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-ink mb-2">Tarefas por data</h3>
        {hasTasks ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E6F0" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
              <Tooltip />
              <Bar dataKey="pendente" stackId="a" fill="#E1A32A" />
              <Bar dataKey="concluida" stackId="a" fill="#2F9E6E" />
              <Bar dataKey="cancelada" stackId="a" fill="#D14D5B" />
              <Bar dataKey="adiada" stackId="a" fill="#7C6FE0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-xs text-muted">
      Sem tarefas neste período
    </div>
  );
}
