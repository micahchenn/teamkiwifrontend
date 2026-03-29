/** @param {Date} d */
export function toDateOnlyString(d) {
  if (!d) return null;
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @param {Date} d */
export function stripTime(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Inclusive range; assumes start <= end on calendar days */
export function eachDayInRange(start, end) {
  const out = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (d <= last) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** @param {(date: Date) => boolean} isUnavailable */
export function rangeHasBlockedDay(start, end, isUnavailable) {
  return eachDayInRange(start, end).some((day) => isUnavailable(day));
}

/** Past dates unavailable; replace with real availability from your API when ready. */
export function isDayUnavailableDemo(date) {
  const t = stripTime(date);
  const today = stripTime(new Date());
  return t < today;
}
