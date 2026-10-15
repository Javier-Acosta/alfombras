export type SalesRange = {
  from: string;
  to: string;
  start?: string;
  end?: string;
};
export function salesDateRange(from = "", to = ""): SalesRange {
  for (const value of [from, to]) {
    if (!value) continue;
    const date = new Date(`${value}T12:00:00Z`);
    if (
      !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      throw new Error("Ingresá fechas válidas.");
  }
  if (from && to && from > to)
    throw new Error("La fecha Desde debe ser anterior o igual a Hasta.");
  // Argentina uses UTC-3. Include both complete local calendar days.
  return {
    from,
    to,
    start: from ? new Date(`${from}T00:00:00-03:00`).toISOString() : undefined,
    end: to ? new Date(`${to}T23:59:59.999-03:00`).toISOString() : undefined,
  };
}
export function saleInRange(created: string, range: SalesRange) {
  const time = new Date(created).getTime();
  return (
    Number.isFinite(time) &&
    (!range.start || time >= Date.parse(range.start)) &&
    (!range.end || time <= Date.parse(range.end))
  );
}
export function salesPeriodLabel(range: SalesRange) {
  const label = (v: string) => v.split("-").reverse().join("/");
  if (range.from && range.to)
    return `Del ${label(range.from)} al ${label(range.to)}`;
  if (range.from) return `Desde el ${label(range.from)}`;
  if (range.to) return `Hasta el ${label(range.to)}`;
  return "Todas las fechas";
}
