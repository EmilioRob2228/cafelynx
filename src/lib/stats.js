import { minutesBetween } from "./format";

const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
const dayKey = (iso) => new Date(iso).toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local

// Una venta es un pedido entregado (cobrado en caja). Los cancelados no cuentan.
export function computeStats(orders, menuItems = []) {
  const sold = orders.filter((o) => o.status === "entregado");
  const placed = orders.filter((o) => o.status !== "cancelado");
  const revenue = sold.reduce((s, o) => s + o.total, 0);

  const toReady = orders.filter((o) => o.ready_at).map((o) => minutesBetween(o.created_at, o.ready_at));
  const toPickup = sold.filter((o) => o.delivered_at).map((o) => minutesBetween(o.created_at, o.delivered_at));
  const prep = orders.filter((o) => o.preparing_at && o.ready_at).map((o) => minutesBetween(o.preparing_at, o.ready_at));

  const byHour = Array.from({ length: 24 }, () => 0);
  placed.forEach((o) => (byHour[new Date(o.created_at).getHours()] += 1));

  const dayMap = new Map();
  sold.forEach((o) => {
    const k = dayKey(o.created_at);
    const d = dayMap.get(k) || { day: k, revenue: 0, orders: 0 };
    d.revenue += o.total;
    d.orders += 1;
    dayMap.set(k, d);
  });
  const byDay = [...dayMap.values()].sort((a, b) => (a.day < b.day ? -1 : 1));

  const prodMap = new Map();
  menuItems.forEach((m) => {
    if (m.available) prodMap.set(m.name, { name: m.name, qty: 0, revenue: 0 });
  });
  sold.forEach((o) =>
    o.items.forEach((it) => {
      const p = prodMap.get(it.name) || { name: it.name, qty: 0, revenue: 0 };
      p.qty += it.qty;
      p.revenue += it.qty * it.price;
      prodMap.set(it.name, p);
    })
  );
  const products = [...prodMap.values()];
  const top = [...products].filter((p) => p.qty > 0).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
  const bottom = [...products].sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name));

  return {
    revenue,
    soldCount: sold.length,
    placedCount: placed.length,
    cancelledCount: orders.filter((o) => o.status === "cancelado").length,
    ticket: sold.length ? revenue / sold.length : 0,
    avgToReady: avg(toReady),
    avgToPickup: avg(toPickup),
    avgPrep: avg(prep),
    byHour,
    byDay,
    products,
    top,
    bottom,
  };
}

export function surveyStats(surveys) {
  const types = {};
  surveys.forEach((s) => {
    const t = s.user_type || "Sin indicar";
    types[t] = (types[t] || 0) + 1;
  });
  return {
    count: surveys.length,
    rating: avg(surveys.map((s) => s.rating)),
    ease: avg(surveys.map((s) => s.ease)),
    satisfied: surveys.length ? (surveys.filter((s) => s.rating >= 4).length / surveys.length) * 100 : null,
    types,
    comments: surveys.filter((s) => s.comment).slice(0, 8),
  };
}
