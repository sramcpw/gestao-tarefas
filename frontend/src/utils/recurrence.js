const FREQ_LABEL = {
  diaria: (n) => (n > 1 ? `a cada ${n} dias` : "todo dia"),
  semanal: (n) => (n > 1 ? `a cada ${n} semanas` : "toda semana"),
  mensal: (n) => (n > 1 ? `a cada ${n} meses` : "todo mês"),
  anual: (n) => (n > 1 ? `a cada ${n} anos` : "todo ano"),
};

export function describeRecurrence(recurrenceRuleJson) {
  if (!recurrenceRuleJson) return null;
  try {
    const rule = JSON.parse(recurrenceRuleJson);
    const interval = rule.interval || 1;
    const label = FREQ_LABEL[rule.freq] ? FREQ_LABEL[rule.freq](interval) : "recorrente";
    return rule.until ? `${label}, até ${rule.until}` : label;
  } catch {
    return "recorrente";
  }
}
