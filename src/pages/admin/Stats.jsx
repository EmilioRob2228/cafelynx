import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Star } from "lucide-react";
import { listMenu, listOrdersRange, listSurveysRange } from "../../lib/api";
import { addDays, dateOf, downloadCsv, fmtMinutes, itemLabel, minutesBetween, money, startOfDay, timeOf } from "../../lib/format";
import { computeStats, surveyStats } from "../../lib/stats";
import { Button } from "../../components/ui/Button.jsx";

const RANGES = [
  { key: "hoy", label: "Hoy", days: 1 },
  { key: "7", label: "7 días", days: 7 },
  { key: "30", label: "30 días", days: 30 },
  { key: "todo", label: "Todo", days: null },
  { key: "custom", label: "Elegir fechas", days: null },
];
const PEAK_HOURS = [9, 11, 13, 15];
const toInput = (d) => d.toLocaleDateString("en-CA");

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-lince-900/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-lince-900/55">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold leading-none text-lince-800">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-lince-900/55">{hint}</p>}
    </div>
  );
}

function Bars({ data, format, highlight, col = "2.25rem" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="no-scrollbar overflow-x-auto">
      <div className="flex h-44 items-end gap-1 pt-6" style={{ minWidth: `calc(${data.length} * (${col} + 0.25rem))` }}>
        {data.map((d, i) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" style={{ minWidth: col }}>
            <span className="pointer-events-none absolute -top-1 text-[11px] font-semibold text-lince-900 opacity-0 transition-opacity group-hover:opacity-100">
              {format(d.value)}
            </span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ delay: i * 0.02, type: "spring", damping: 22 }}
              style={{ minHeight: d.value ? 4 : 2 }}
              className={`w-full rounded-t-md ${highlight?.(d) ? "bg-arena-500" : "bg-lince-700"} ${d.value ? "" : "opacity-20"}`}
              title={`${d.label}: ${format(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 pt-1.5" style={{ minWidth: `calc(${data.length} * (${col} + 0.25rem))` }}>
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[10px] font-medium text-lince-900/60" style={{ minWidth: col }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-3xl border border-lince-900/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Ranking({ rows, empty }) {
  if (!rows.length) return <p className="py-4 text-sm text-lince-900/50">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.qty));
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.name} className="text-sm">
          <div className="mb-1 flex justify-between gap-3">
            <span className="truncate font-semibold"><span className="mr-2 text-lince-900/40">{i + 1}</span>{r.name}</span>
            <span className="shrink-0 text-lince-900/70">{r.qty} · {money(r.revenue)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-lince-900/5">
            <div className="h-full rounded-full bg-lince-600" style={{ width: `${(r.qty / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Stats() {
  const [range, setRange] = useState("hoy");
  const [from, setFrom] = useState(toInput(addDays(new Date(), -6)));
  const [to, setTo] = useState(toInput(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const bounds = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    const end = addDays(startOfDay(), 1);
    if (range === "custom") {
      const s = new Date(`${from}T00:00:00`);
      const e = addDays(new Date(`${to}T00:00:00`), 1);
      return { s, e };
    }
    if (r.days) return { s: addDays(end, -r.days), e: end };
    return { s: new Date("2020-01-01T00:00:00"), e: end };
  }, [range, from, to]);

  useEffect(() => {
    let alive = true;
    setData(null);
    Promise.all([
      listOrdersRange(bounds.s.toISOString(), bounds.e.toISOString()),
      listSurveysRange(bounds.s.toISOString(), bounds.e.toISOString()),
      listMenu(),
    ])
      .then(([orders, surveys, menu]) => alive && (setData({ orders, surveys, menu }), setError("")))
      .catch((e) => alive && setError(e.message || "No se pudieron cargar las estadísticas."));
    return () => {
      alive = false;
    };
  }, [bounds]);

  const stats = useMemo(() => data && computeStats(data.orders, data.menu), [data]);
  const survey = useMemo(() => data && surveyStats(data.surveys), [data]);

  const hours = useMemo(() => {
    if (!stats) return [];
    const withData = stats.byHour.map((v, h) => (v ? h : -1)).filter((h) => h >= 0);
    const lo = Math.min(7, ...withData);
    const hi = Math.max(18, ...withData);
    return Array.from({ length: hi - lo + 1 }, (_, i) => ({ label: `${lo + i}`, hour: lo + i, value: stats.byHour[lo + i] }));
  }, [stats]);

  const stamp = new Date().toLocaleDateString("en-CA");
  const exportOrders = () =>
    downloadCsv(`cafelynx-pedidos-${stamp}.csv`, [
      ["Codigo", "Fecha", "Hora", "Cliente", "Estado", "Total", "Productos", "Notas", "Min a listo", "Min a entrega"],
      ...data.orders.map((o) => [
        o.code, dateOf(o.created_at), timeOf(o.created_at), o.customer_name, o.status, o.total,
        o.items.map((i) => `${i.qty}x ${itemLabel({ name: i.name, label: i.label })}`).join(" | "), o.notes || "",
        o.ready_at ? minutesBetween(o.created_at, o.ready_at).toFixed(1) : "",
        o.delivered_at ? minutesBetween(o.created_at, o.delivered_at).toFixed(1) : "",
      ]),
    ]);
  const exportProducts = () =>
    downloadCsv(`cafelynx-productos-${stamp}.csv`, [
      ["Producto", "Cantidad vendida", "Ingreso"],
      ...[...stats.products].sort((a, b) => b.qty - a.qty).map((p) => [p.name, p.qty, p.revenue]),
    ]);
  const exportSurveys = () =>
    downloadCsv(`cafelynx-encuestas-${stamp}.csv`, [
      ["Fecha", "Pedido", "Satisfaccion (1-5)", "Facilidad de uso (1-5)", "Tipo de usuario", "Comentario"],
      ...data.surveys.map((s) => [`${dateOf(s.created_at)} ${timeOf(s.created_at)}`, s.orders?.code || "", s.rating, s.ease, s.user_type || "", s.comment || ""]),
    ]);

  const multiDay = range !== "hoy";

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">Estadísticas</h1>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${range === r.key ? "bg-lince-950 text-arena-400" : "bg-white hover:bg-lince-100"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">Desde <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-lince-900/15 bg-white px-3 py-2" /></label>
          <label className="flex items-center gap-2">Hasta <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-lince-900/15 bg-white px-3 py-2" /></label>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!data && !error && <p className="py-16 text-center text-lince-900/60">Calculando...</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Vendido" value={money(stats.revenue)} hint={`${stats.soldCount} ${stats.soldCount === 1 ? "pedido cobrado" : "pedidos cobrados"}`} />
            <Kpi label="Pedidos recibidos" value={stats.placedCount} hint={stats.cancelledCount ? `${stats.cancelledCount} cancelados` : "Sin cancelados"} />
            <Kpi label="Ticket promedio" value={money(Math.round(stats.ticket))} hint="Por pedido cobrado" />
            <Kpi label="Espera a “listo”" value={fmtMinutes(stats.avgToReady)} hint={`Hasta recoger: ${fmtMinutes(stats.avgToPickup)}`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Pedidos por hora">
              <Bars data={hours} col="1.25rem" format={(v) => `${v} pedidos`} highlight={(d) => PEAK_HOURS.includes(d.hour)} />
              <p className="mt-2 text-xs text-lince-900/55">En color arena, las horas de mayor afluencia (9, 11, 13 y 15 h).</p>
            </Panel>
            {multiDay ? (
              <Panel title="Ventas por día">
                {stats.byDay.length ? (
                  <Bars data={stats.byDay.map((d) => ({ label: d.day.slice(5), value: d.revenue }))} format={money} />
                ) : (
                  <p className="py-8 text-sm text-lince-900/50">Aún no hay ventas en este periodo.</p>
                )}
              </Panel>
            ) : (
              <Panel title="Tiempos de atención">
                <dl className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Preparación", stats.avgPrep],
                    ["Hasta listo", stats.avgToReady],
                    ["Hasta recoger", stats.avgToPickup],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-lince-50 p-3">
                      <dt className="text-xs font-semibold uppercase text-lince-900/55">{k}</dt>
                      <dd className="mt-1 font-display text-2xl font-bold">{fmtMinutes(v)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-lince-900/55">Promedios de los pedidos de hoy, medidos desde que se recibe el pedido.</p>
              </Panel>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Más vendidos"><Ranking rows={stats.top.slice(0, 10)} empty="Aún no hay ventas registradas." /></Panel>
            <Panel title="Menos vendidos"><Ranking rows={stats.bottom.slice(0, 10)} empty="Sin datos." /></Panel>
          </div>

          <Panel title="Satisfacción de usuarios">
            {survey.count === 0 ? (
              <p className="text-sm text-lince-900/50">Todavía no hay encuestas contestadas en este periodo.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Kpi label="Encuestas" value={survey.count} />
                  <Kpi label="Satisfacción" value={`${survey.rating.toFixed(1)} / 5`} />
                  <Kpi label="Facilidad de uso" value={`${survey.ease.toFixed(1)} / 5`} />
                  <Kpi label="Satisfechos (4-5)" value={`${Math.round(survey.satisfied)}%`} hint="Meta del proyecto: 80% o más" />
                </div>
                <p className="mt-3 text-sm text-lince-900/65">
                  {Object.entries(survey.types).map(([t, n]) => `${t}: ${n}`).join(" · ")}
                </p>
                {survey.comments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {survey.comments.map((c) => (
                      <li key={c.id} className="flex items-start gap-3 rounded-xl bg-lince-50 px-4 py-3 text-sm">
                        <span className="flex shrink-0 items-center gap-1 font-bold text-arena-600"><Star size={14} className="fill-arena-500 text-arena-500" />{c.rating}</span>
                        <span>{c.comment}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Panel>

          <Panel title="Exportar datos">
            <p className="mb-3 text-sm text-lince-900/65">Archivos CSV del periodo seleccionado, para el análisis de resultados y el informe.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportOrders}><Download size={16} /> Pedidos y tiempos</Button>
              <Button variant="outline" onClick={exportProducts}><Download size={16} /> Productos</Button>
              <Button variant="outline" onClick={exportSurveys}><Download size={16} /> Encuestas</Button>
            </div>
          </Panel>
        </>
      )}
    </main>
  );
}
