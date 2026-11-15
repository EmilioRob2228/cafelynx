const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const money = (n) => mxn.format(Number(n) || 0);

export const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const STATUS = {
  pendiente: { label: "Recibido", short: "Recibido" },
  preparando: { label: "En preparación", short: "Preparando" },
  listo: { label: "Listo para recoger", short: "Listo" },
  entregado: { label: "Entregado", short: "Entregado" },
  cancelado: { label: "Cancelado", short: "Cancelado" },
};

export const itemLabel = (it) => (it.label ? `${it.name} (${it.label})` : it.name);

export const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

export const dateOf = (iso) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

export function elapsed(iso, now = Date.now()) {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export const minutesBetween = (a, b) => (new Date(b) - new Date(a)) / 60000;

export const fmtMinutes = (m) => (m == null || Number.isNaN(m) ? "-" : m < 1 ? "<1 min" : `${m.toFixed(1)} min`);

export function downloadCsv(filename, rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
