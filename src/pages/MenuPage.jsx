import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Minus, Plus, Search, Wallet } from "lucide-react";
import { getOrder, listMenu } from "../lib/api";
import { lineKey, useCart } from "../lib/cart.jsx";
import { money, STATUS } from "../lib/format";
import { Logo } from "../components/Logo.jsx";

const CATEGORY_ORDER = ["Tortas", "Tacos", "Generales", "Especiales"];

function Hero() {
  return (
    <section className="pattern-lynx relative overflow-hidden bg-lince-950 text-white">
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-10 w-72 rotate-[-8deg] opacity-[0.07] md:right-8 md:w-[26rem]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-7 pt-6 md:pb-14 md:pt-12">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-arena-400"
        >
          <Clock size={13} /> Pedidos anticipados · Campus II
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-wide sm:text-6xl md:text-8xl"
        >
          Pide antes.
          <br />
          <span className="text-arena-500">Recoge sin fila.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-3 max-w-md text-[15px] text-white/75 md:mt-4 md:text-lg"
        >
          Arma tu pedido desde el celular y llega a la Cafetería 3 cuando esté listo. Sin esperar en la fila de los cambios de clase.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-4 flex flex-wrap gap-2 text-[13px] md:mt-6 md:text-sm"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 md:gap-2 md:px-3.5 md:py-2">
            <Wallet size={15} className="text-arena-400" /> Pagas en caja al recoger
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 md:gap-2 md:px-3.5 md:py-2">
            <Check size={15} className="text-arena-400" /> Seguimiento en tiempo real
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function ActiveOrderBanner() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let alive = true;
    try {
      const last = JSON.parse(localStorage.getItem("cl_last_order") || "null");
      if (!last) return;
      getOrder(last.id)
        .then((o) => {
          if (alive && o && !["entregado", "cancelado"].includes(o.status)) setOrder(o);
        })
        .catch(() => {});
    } catch {
      /* sin pedido guardado */
    }
    return () => {
      alive = false;
    };
  }, []);

  if (!order) return null;
  const ready = order.status === "listo";
  return (
    <Link
      to={`/pedido/${order.id}`}
      className={`mx-auto mt-4 flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-5 py-4 ${
        ready ? "bg-lince-600 text-white" : "bg-arena-100 text-lince-950"
      }`}
      style={{ width: "calc(100% - 2rem)" }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Pedido en curso · #{order.code}</p>
        <p className="font-display text-2xl font-bold uppercase leading-tight">{STATUS[order.status].label}</p>
      </div>
      <span className="flex items-center gap-1 text-sm font-semibold">
        Ver seguimiento <ArrowRight size={16} />
      </span>
    </Link>
  );
}

function ProductCard({ item }) {
  const { lines, add, setQty } = useCart();
  const [optIdx, setOptIdx] = useState(0);
  const today = new Date().getDay();
  const blockedByDay = item.days && !item.days.includes(today);
  const unavailable = !item.available || blockedByDay;
  const options = item.options.length ? item.options : [{ label: "", price: 0 }];
  const opt = options[optIdx] || options[0];
  const line = lines.find((l) => l.key === lineKey(item.id, opt.label));

  return (
    <motion.article
      layout
      className={`flex flex-col justify-between rounded-2xl border bg-white p-4 transition-shadow ${
        unavailable ? "border-lince-900/5 opacity-60" : "border-lince-900/10 hover:shadow-lg hover:shadow-lince-900/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug">{item.name}</h3>
          {item.description && <p className="mt-0.5 text-sm text-arena-600">{item.description}</p>}
        </div>
        <p className="shrink-0 font-display text-3xl font-bold leading-none text-lince-800">{money(opt.price)}</p>
      </div>

      {options.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Opciones de precio">
          {options.map((o, i) => (
            <button
              key={i}
              role="radio"
              aria-checked={i === optIdx}
              onClick={() => setOptIdx(i)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                i === optIdx ? "border-lince-900 bg-lince-900 text-white" : "border-lince-900/15 text-lince-900 hover:bg-lince-50"
              }`}
            >
              {o.label || money(o.price)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {unavailable ? (
          <p className="rounded-xl bg-lince-900/5 py-2.5 text-center text-sm font-semibold text-lince-900/60">
            {!item.available ? "Agotado" : "No se vende hoy"}
          </p>
        ) : line ? (
          <div className="flex items-center justify-between rounded-xl bg-lince-50 p-1">
            <button onClick={() => setQty(line.key, line.qty - 1)} className="grid h-10 w-12 place-items-center rounded-lg bg-white shadow-sm" aria-label="Quitar uno">
              <Minus size={17} />
            </button>
            <motion.span key={line.qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-base font-bold">
              {line.qty}
            </motion.span>
            <button onClick={() => add(item, opt)} className="grid h-10 w-12 place-items-center rounded-lg bg-lince-900 text-white" aria-label="Agregar uno">
              <Plus size={17} />
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => add(item, opt)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lince-900 text-sm font-semibold text-white hover:bg-lince-800"
          >
            <Plus size={17} /> Agregar
          </motion.button>
        )}
      </div>
    </motion.article>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-lince-900/5" />
      ))}
    </div>
  );
}

export default function MenuPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const sections = useRef({});

  useEffect(() => {
    listMenu()
      .then(setItems)
      .catch((e) => setError(e.message || "No se pudo cargar el menú."));
  }, []);

  const grouped = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
    const cats = [...new Set(filtered.map((i) => i.category))].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return cats.map((c) => ({ category: c, items: filtered.filter((i) => i.category === c) }));
  }, [items, query]);

  useEffect(() => {
    if (!grouped.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.dataset.cat);
      },
      { rootMargin: "-140px 0px -65% 0px" }
    );
    Object.values(sections.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [grouped]);

  const goTo = (cat) => sections.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Hero />
      <ActiveOrderBanner />

      <div className="sticky top-[68px] z-20 mt-4 border-b border-lince-900/10 bg-crema/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {grouped.map((g) => (
              <button
                key={g.category}
                onClick={() => goTo(g.category)}
                className={`shrink-0 rounded-full px-4 py-2 font-display text-lg font-bold uppercase tracking-wide transition-colors ${
                  active === g.category ? "bg-lince-950 text-arena-400" : "bg-white text-lince-900 hover:bg-lince-100"
                }`}
              >
                {g.category}
              </button>
            ))}
          </div>
          <label className="relative hidden w-56 sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lince-900/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el menú"
              className="h-10 w-full rounded-full border border-lince-900/15 bg-white pl-9 pr-3 text-sm focus:border-lince-700 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6">
        <label className="relative mb-5 block sm:hidden">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lince-900/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el menú"
            className="h-11 w-full rounded-xl border border-lince-900/15 bg-white pl-10 pr-3 text-base focus:border-lince-700 focus:outline-none"
          />
        </label>

        {error && <p className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {!items && !error && <Skeleton />}
        {items && grouped.length === 0 && <p className="py-12 text-center text-lince-900/60">No encontramos productos con esa búsqueda.</p>}

        {grouped.map((g) => (
          <section key={g.category} data-cat={g.category} ref={(el) => (sections.current[g.category] = el)} className="mb-10 scroll-mt-36">
            <h2 className="mb-4 flex items-baseline gap-3 font-display text-4xl font-extrabold uppercase tracking-wide">
              {g.category}
              <span className="h-px flex-1 bg-lince-900/15" />
              <span className="text-base font-semibold text-lince-900/40">{g.items.length}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => (
                <ProductCard key={it.id} item={it} />
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-12 flex items-center justify-center gap-3 border-t border-lince-900/10 pt-8 text-sm text-lince-900/60">
          <Logo size={32} />
          <span>CafeLYNX · Prototipo académico, TecNM Celaya Campus II</span>
        </footer>
      </main>
    </>
  );
}
