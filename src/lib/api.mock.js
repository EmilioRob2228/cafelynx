// Modo demostracion: guarda todo en localStorage del navegador.
// Se usa cuando no hay variables de Supabase; sirve para probar la interfaz.
import { MENU_SEED } from "../data/menuSeed";

const K = { menu: "cl_demo_menu", orders: "cl_demo_orders", surveys: "cl_demo_surveys", counter: "cl_demo_counter" };
export const DEMO_ADMIN_PASSWORD = "lince";

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const listeners = new Set();
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("cafelynx-demo") : null;
if (channel) channel.onmessage = () => listeners.forEach((fn) => fn());
const emit = () => {
  listeners.forEach((fn) => fn());
  channel?.postMessage("changed");
};

const uuid = () => crypto.randomUUID();
const tzDay = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

function menu() {
  let m = load(K.menu, null);
  if (!m) {
    m = MENU_SEED.map((it, i) => ({
      id: uuid(),
      category: it.category,
      name: it.name,
      description: it.note || null,
      options: it.options,
      days: it.days || null,
      available: true,
      sort: i + 1,
    }));
    save(K.menu, m);
  }
  return m;
}

const stamp = { preparando: "preparing_at", listo: "ready_at", entregado: "delivered_at", cancelado: "cancelled_at" };

// ---- Cliente
export async function listMenu() {
  return menu();
}

export async function createOrder({ name, notes, lines }) {
  name = (name || "").trim();
  if (name.length < 2) throw new Error("Escribe tu nombre (2 a 60 caracteres).");
  if (!lines.length) throw new Error("El pedido esta vacio.");
  const dow = new Date().getDay();
  const m = menu();
  let total = 0;
  const items = lines.map((l) => {
    const it = m.find((x) => x.id === l.itemId);
    if (!it || !it.available) throw new Error("Un producto ya no esta disponible.");
    if (it.days && !it.days.includes(dow)) throw new Error(`${it.name} no se vende hoy.`);
    const opt = it.options.find((o) => (o.label || "") === (l.label || ""));
    if (!opt) throw new Error("Opcion de precio invalida.");
    total += opt.price * l.qty;
    return { name: it.name, label: opt.label || "", price: opt.price, qty: l.qty };
  });
  const day = tzDay();
  const counter = load(K.counter, {});
  counter[day] = (counter[day] || 0) + 1;
  save(K.counter, counter);
  const order = {
    id: uuid(),
    day,
    seq: counter[day],
    code: String(counter[day]).padStart(3, "0"),
    customer_name: name,
    notes: (notes || "").trim().slice(0, 200) || null,
    status: "pendiente",
    total,
    created_at: new Date().toISOString(),
    preparing_at: null,
    ready_at: null,
    delivered_at: null,
    cancelled_at: null,
    items,
  };
  save(K.orders, [...load(K.orders, []), order]);
  emit();
  return { id: order.id, code: order.code, total };
}

export async function getOrder(id) {
  const orders = load(K.orders, []);
  const o = orders.find((x) => x.id === id);
  if (!o) return null;
  const ahead = orders.filter(
    (x) => x.day === o.day && x.seq < o.seq && ["pendiente", "preparando"].includes(x.status)
  ).length;
  const surveyed = load(K.surveys, []).some((s) => s.order_id === id);
  return { ...o, ahead, surveyed };
}

export async function submitSurvey(orderId, { rating, ease, userType, comment }) {
  const all = load(K.surveys, []);
  if (all.some((s) => s.order_id === orderId)) return;
  const order = load(K.orders, []).find((o) => o.id === orderId);
  all.push({
    id: uuid(),
    order_id: orderId,
    rating,
    ease,
    user_type: userType || null,
    comment: (comment || "").trim().slice(0, 500) || null,
    created_at: new Date().toISOString(),
    orders: { code: order?.code },
  });
  save(K.surveys, all);
  emit();
}

// ---- Admin
export async function getAdminSession() {
  return sessionStorage.getItem("cl_demo_admin") ? { email: "admin@demo" } : null;
}

export async function adminSignIn(email, password) {
  if (password !== DEMO_ADMIN_PASSWORD) throw new Error("Contraseña incorrecta (en modo demo es \"lince\").");
  sessionStorage.setItem("cl_demo_admin", "1");
  return { email: email || "admin@demo" };
}

export async function adminSignOut() {
  sessionStorage.removeItem("cl_demo_admin");
}

export async function listBoardOrders(sinceISO) {
  return load(K.orders, []).filter(
    (o) => ["pendiente", "preparando", "listo"].includes(o.status) || o.created_at >= sinceISO
  );
}

export async function listOrdersRange(fromISO, toISO) {
  return load(K.orders, []).filter((o) => o.created_at >= fromISO && o.created_at < toISO);
}

export async function listSurveysRange(fromISO, toISO) {
  return load(K.surveys, [])
    .filter((s) => s.created_at >= fromISO && s.created_at < toISO)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function setOrderStatus(id, status) {
  const orders = load(K.orders, []).map((o) =>
    o.id === id ? { ...o, status, ...(stamp[status] ? { [stamp[status]]: new Date().toISOString() } : {}) } : o
  );
  save(K.orders, orders);
  emit();
}

export function subscribeOrders(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function saveMenuItem(item) {
  const m = menu();
  const row = {
    category: item.category,
    name: item.name,
    description: item.description || null,
    options: item.options,
    days: item.days && item.days.length ? item.days : null,
    available: item.available,
    sort: item.sort ?? 0,
  };
  if (item.id) save(K.menu, m.map((x) => (x.id === item.id ? { ...x, ...row } : x)));
  else save(K.menu, [...m, { id: uuid(), ...row, sort: m.length + 1 }]);
  emit();
}

export async function deleteMenuItem(id) {
  save(K.menu, menu().filter((x) => x.id !== id));
  emit();
}
