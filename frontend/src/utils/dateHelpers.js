function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day; // volta para segunda-feira
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getRange(referenceDate, periodType) {
  const ref = new Date(referenceDate);

  if (periodType === "diaria") {
    const start = new Date(ref);
    return { start: toISODate(start), end: toISODate(start) };
  }

  if (periodType === "semanal") {
    const start = startOfWeek(ref);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start: toISODate(start), end: toISODate(end) };
  }

  if (periodType === "mensal") {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { start: toISODate(start), end: toISODate(end) };
  }

  // anual
  const start = new Date(ref.getFullYear(), 0, 1);
  const end = new Date(ref.getFullYear(), 11, 31);
  return { start: toISODate(start), end: toISODate(end) };
}

export function shiftDate(referenceDate, periodType, direction) {
  const d = new Date(referenceDate);
  if (periodType === "diaria") d.setDate(d.getDate() + direction);
  else if (periodType === "semanal") d.setDate(d.getDate() + direction * 7);
  else if (periodType === "mensal") d.setMonth(d.getMonth() + direction);
  else d.setFullYear(d.getFullYear() + direction);
  return d;
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function formatRangeLabel(referenceDate, periodType) {
  const { start, end } = getRange(referenceDate, periodType);
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");

  if (periodType === "diaria") {
    return `${s.getDate()} de ${MONTHS[s.getMonth()]} de ${s.getFullYear()}`;
  }
  if (periodType === "semanal") {
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} — ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} de ${e.getFullYear()}`;
  }
  if (periodType === "mensal") {
    return `${MONTHS[s.getMonth()]} de ${s.getFullYear()}`;
  }
  return `${s.getFullYear()}`;
}

export { toISODate };
