// Gera as datas de ocorrencia de uma tarefa recorrente a partir de uma data inicial.
// O "padrao" (ex.: toda terca, todo dia 5) e derivado automaticamente da propria
// due_date escolhida pelo usuario: o dia da semana/mes/ano da primeira ocorrencia
// e repetido conforme a frequencia e o intervalo informados.

const VALID_FREQ = ["diaria", "semanal", "mensal", "anual"];

// Limites padrao (quando o usuario nao informa uma data final "ate"):
// evita gerar tarefas indefinidamente.
const DEFAULT_HORIZON = {
  diaria: { count: 60, days: 90 },     // ate 60 ocorrencias ou 90 dias
  semanal: { count: 26, days: 182 },   // ~6 meses
  mensal: { count: 12, days: 366 },    // ~1 ano
  anual: { count: 5, days: 365 * 5 },  // 5 anos
};
const HARD_CAP = 150; // trava de seguranca, nunca gera mais que isso numa unica serie

function parseISO(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}
function toISO(date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function addMonths(date, n) {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setDate(1); // evita overflow de mes (ex.: 31 jan + 1 mes)
  d.setMonth(d.getMonth() + n);
  const lastDayOfTarget = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, lastDayOfTarget));
  return d;
}
function addYears(date, n) {
  return addMonths(date, n * 12);
}

function isValidRecurrenceRule(rule) {
  if (!rule || typeof rule !== "object") return false;
  if (!VALID_FREQ.includes(rule.freq)) return false;
  if (rule.interval != null && (!Number.isInteger(rule.interval) || rule.interval < 1 || rule.interval > 30)) {
    return false;
  }
  if (rule.until && Number.isNaN(Date.parse(rule.until))) return false;
  return true;
}

function generateOccurrenceDates(startDateStr, rule) {
  const freq = rule.freq;
  const interval = rule.interval && rule.interval > 0 ? rule.interval : 1;
  const untilDate = rule.until ? parseISO(rule.until) : null;
  const horizon = DEFAULT_HORIZON[freq] || DEFAULT_HORIZON.mensal;
  const maxCount = Math.min(HARD_CAP, horizon.count);
  const horizonDate = addDays(parseISO(startDateStr), horizon.days);

  const dates = [];
  let current = parseISO(startDateStr);

  while (dates.length < maxCount) {
    if (untilDate && current > untilDate) break;
    if (!untilDate && current > horizonDate) break;

    dates.push(toISO(current));

    if (freq === "diaria") current = addDays(current, interval);
    else if (freq === "semanal") current = addDays(current, interval * 7);
    else if (freq === "mensal") current = addMonths(current, interval);
    else current = addYears(current, interval);
  }

  return dates;
}

module.exports = { generateOccurrenceDates, isValidRecurrenceRule, VALID_FREQ };
