// Ordem do mais urgente para o menos urgente — usada para ordenar os cartoes
// dentro de cada coluna do Kanban e para a lista de prioridades no filtro.
export const PRIORITIES = [
  {
    key: "urgente",
    label: "Urgente",
    badgeClass: "bg-priority-urgente/10 text-priority-urgente border-priority-urgente/30",
    activeClass: "bg-priority-urgente/20 text-priority-urgente border-priority-urgente/50",
  },
  {
    key: "alta",
    label: "Alta",
    badgeClass: "bg-priority-alta/10 text-priority-alta border-priority-alta/30",
    activeClass: "bg-priority-alta/20 text-priority-alta border-priority-alta/50",
  },
  {
    key: "media",
    label: "Média",
    badgeClass: "bg-priority-media/10 text-priority-media border-priority-media/30",
    activeClass: "bg-priority-media/20 text-priority-media border-priority-media/50",
  },
  {
    key: "baixa",
    label: "Baixa",
    badgeClass: "bg-priority-baixa/10 text-priority-baixa border-priority-baixa/30",
    activeClass: "bg-priority-baixa/20 text-priority-baixa border-priority-baixa/50",
  },
];

const RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p.key, i]));

export function priorityRank(key) {
  return RANK[key] ?? RANK.media;
}

export function priorityMeta(key) {
  return PRIORITIES.find((p) => p.key === key) || PRIORITIES.find((p) => p.key === "media");
}
