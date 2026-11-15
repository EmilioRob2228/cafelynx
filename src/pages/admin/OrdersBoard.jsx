import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, StickyNote } from "lucide-react";
import { listBoardOrders, setOrderStatus, subscribeOrders } from "../../lib/api";
import { elapsed, itemLabel, money, startOfDay, timeOf } from "../../lib/format";
import { playNewOrder } from "../../lib/sound";
import { Button } from "../../components/ui/Button.jsx";

const COLUMNS = [
  { key: "pendiente", title: "Pendientes" },
  { key: "preparando", title: "Preparando" },
  { key: "listo", title: "Listos" },
  { key: "entregado", title: "Entregados hoy" },
];

const ACTION = {
  pendiente: { to: "preparando", label: "Preparar", variant: "primary" },
  preparando: { to: "listo", label: "Marcar listo", variant: "success" },
  listo: { to: "entregado", label: "Entregar y cobrar", variant: "accent" },
};

function OrderCard({ order, now, onMove }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const action = ACTION[order.status];
  const waiting = order.status === "pendiente" && (now - new Date(order.created_at)) / 60000 >= 10;

  useEffect(() => {
    if (!confirmCancel) return;
    const t = setTimeout(() => setConfirmCancel(false), 3500);
    return () => clearTimeout(t);
  }, [confirmCancel]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-2xl border border-lince-900/10 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-4xl font-extrabold leading-none text-lince-800">#{order.code}</p>
          <p className="mt-1 font-semibold">{order.customer_name}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold leading-none">{money(order.total)}</p>
          <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${waiting ? "bg-red-100 text-red-800" : "bg-lince-50 text-lince-800"}`}>
            {timeOf(order.created_at)} · hace {elapsed(order.created_at, now)}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-[15px]">
        {order.items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <b className="w-7 shrink-0 text-lince-700">{it.qty}x</b>
            <span>{itemLabel({ name: it.name, label: it.label })}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-3 flex gap-2 rounded-lg bg-arena-100 px-3 py-2 text-sm">
          <StickyNote size={16} className="mt-0.5 shrink-0 text-arena-600" /> {order.notes}
        </p>
      )}

      {action && (
        <div className="mt-4 space-y-1.5">
          <Button variant={action.variant} className="w-full" onClick={() => onMove(order.id, action.to)}>
            {action.label}
          </Button>
          <button
            onClick={() => (confirmCancel ? onMove(order.id, "cancelado") : setConfirmCancel(true))}
            className={`w-full rounded-lg py-1.5 text-sm font-semibold ${
              confirmCancel ? "bg-red-700 text-white" : "text-red-700 hover:bg-red-50"
            }`}
          >
            {confirmCancel ? "Toca otra vez para cancelar" : "Cancelar pedido"}
          </button>
        </div>
      )}
    </motion.article>
  );
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState("pendiente");
  const [query, setQuery] = useState("");
  const knownPending = useRef(null);

  const load = useCallback(async () => {
    try {
      const rows = await listBoardOrders(startOfDay().toISOString());
      const pendingIds = new Set(rows.filter((o) => o.status === "pendiente").map((o) => o.id));
      if (knownPending.current) {
        for (const id of pendingIds) {
          if (!knownPending.current.has(id)) {
            playNewOrder();
            break;
          }
        }
      }
      knownPending.current = pendingIds;
      setOrders(rows);
      setError("");
    } catch (e) {
      setError(e.message || "No se pudieron cargar los pedidos.");
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = subscribeOrders(load);
    const poll = setInterval(load, 15000);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      unsub();
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const move = async (id, status) => {
    setOrders((prev) => prev && prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await setOrderStatus(id, status);
    } catch (e) {
      setError(e.message || "No se pudo actualizar el pedido.");
    }
    load();
  };

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    return q ? orders.filter((o) => o.code.includes(q) || o.customer_name.toLowerCase().includes(q)) : orders;
  }, [orders, query]);

  const todaySales = useMemo(
    () => (orders || []).filter((o) => o.status === "entregado").reduce((s, o) => s + o.total, 0),
    [orders]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">Pedidos de hoy</h1>
          <p className="text-sm text-lince-900/60">Se actualiza en vivo. Vendido hoy: <b className="text-lince-800">{money(todaySales)}</b></p>
        </div>
        <label className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lince-900/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número o nombre"
            className="h-11 w-full rounded-xl border border-lince-900/15 bg-white pl-9 pr-3 text-sm focus:border-lince-700 focus:outline-none"
          />
        </label>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto md:hidden">
        {COLUMNS.map((c) => {
          const n = filtered.filter((o) => o.status === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setTab(c.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === c.key ? "bg-lince-950 text-arena-400" : "bg-white"}`}
            >
              {c.title} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {!orders ? (
        <p className="py-12 text-center text-lince-900/60">Cargando pedidos...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {COLUMNS.map((c) => {
            const list = filtered.filter((o) => o.status === c.key);
            return (
              <section key={c.key} className={`${tab === c.key ? "block" : "hidden"} rounded-3xl bg-lince-900/[0.04] p-3 md:block`}>
                <h2 className="mb-3 flex items-center justify-between px-1 font-display text-xl font-bold uppercase tracking-wide text-lince-800">
                  {c.title}
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-sm">{list.length}</span>
                </h2>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {list.map((o) => (
                      <OrderCard key={o.id} order={o} now={now} onMove={move} />
                    ))}
                  </AnimatePresence>
                  {list.length === 0 && <p className="py-8 text-center text-sm text-lince-900/40">Sin pedidos</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
