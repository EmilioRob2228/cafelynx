import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowLeft, BellRing, Check, ChefHat, ClipboardCheck, PackageCheck, Star, Store, XCircle } from "lucide-react";
import { getOrder, submitSurvey } from "../lib/api";
import { itemLabel, money, STATUS, timeOf } from "../lib/format";
import { playReady, vibrate } from "../lib/sound";
import { Button } from "../components/ui/Button.jsx";

const STEPS = [
  { key: "pendiente", label: "Recibido", Icon: ClipboardCheck },
  { key: "preparando", label: "Preparando", Icon: ChefHat },
  { key: "listo", label: "Listo", Icon: BellRing },
  { key: "entregado", label: "Recogido", Icon: PackageCheck },
];
const FINAL = ["entregado", "cancelado"];

function Stepper({ status }) {
  const current = Math.max(0, STEPS.findIndex((s) => s.key === status));
  return (
    <div className="relative mt-8 px-2">
      <div className="absolute left-[12.5%] right-[12.5%] top-6 h-1 rounded-full bg-lince-900/10" />
      <motion.div
        className="absolute left-[12.5%] top-6 h-1 rounded-full bg-lince-600"
        initial={false}
        animate={{ width: `${(current / (STEPS.length - 1)) * 75}%` }}
        transition={{ type: "spring", damping: 24, stiffness: 120 }}
      />
      <ol className="relative grid grid-cols-4">
        {STEPS.map((s, i) => {
          const done = i < current || (status === "entregado" && i === current);
          const now = i === current && status !== "entregado";
          return (
            <li key={s.key} className="flex flex-col items-center gap-2 text-center">
              <motion.div
                animate={now ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={now ? { repeat: Infinity, duration: 1.8 } : undefined}
                className={`grid h-12 w-12 place-items-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-lince-600 bg-lince-600 text-white"
                    : now
                      ? "border-lince-900 bg-lince-900 text-arena-400"
                      : "border-lince-900/15 bg-crema text-lince-900/35"
                }`}
              >
                {done ? <Check size={20} /> : <s.Icon size={20} />}
              </motion.div>
              <span className={`text-xs font-semibold ${done || now ? "text-lince-950" : "text-lince-900/40"}`}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Rating({ label, value, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-label={`${n} de 5`} className="p-1">
            <Star size={30} className={n <= value ? "fill-arena-500 text-arena-500" : "text-lince-900/25"} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Survey({ orderId, onDone }) {
  const [rating, setRating] = useState(0);
  const [ease, setEase] = useState(0);
  const [userType, setUserType] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!rating || !ease) {
      setError("Califica ambas preguntas con las estrellas.");
      return;
    }
    setBusy(true);
    try {
      await submitSurvey(orderId, { rating, ease, userType, comment });
      onDone();
    } catch (e) {
      setError(e.message || "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-lince-900/10 bg-white p-5">
      <h3 className="font-display text-2xl font-bold uppercase tracking-wide">¿Cómo te fue?</h3>
      <p className="mb-4 text-sm text-lince-900/60">Dos preguntas rápidas para mejorar CafeLYNX.</p>
      <div className="space-y-4">
        <Rating label="¿Qué tan satisfecho estás con el servicio?" value={rating} onChange={setRating} />
        <Rating label="¿Qué tan fácil fue usar la página?" value={ease} onChange={setEase} />
        <div>
          <p className="mb-1.5 text-sm font-semibold">Soy</p>
          <div className="flex flex-wrap gap-2">
            {["Estudiante", "Docente", "Otro"].map((t) => (
              <button
                key={t}
                onClick={() => setUserType(t === userType ? "" : t)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                  userType === t ? "border-lince-900 bg-lince-900 text-white" : "border-lince-900/15"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Comentarios o sugerencias (opcional)"
          className="w-full rounded-xl border border-lince-900/15 px-4 py-3 text-base focus:border-lince-700 focus:outline-none"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button className="w-full" onClick={send} disabled={busy}>
          {busy ? "Enviando..." : "Enviar opinión"}
        </Button>
      </div>
    </section>
  );
}

export default function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined); // undefined = cargando, null = no existe
  const [surveyed, setSurveyed] = useState(false);
  const prevStatus = useRef(null);

  useEffect(() => {
    let alive = true;
    let timer;
    const tick = async () => {
      try {
        const o = await getOrder(id);
        if (!alive) return;
        setOrder(o);
        if (o?.surveyed) setSurveyed(true);
        if (o && prevStatus.current && prevStatus.current !== "listo" && o.status === "listo") {
          playReady();
          vibrate();
          confetti({ particleCount: 140, spread: 80, origin: { y: 0.35 }, colors: ["#136041", "#c8a870", "#ffffff", "#001e13"] });
        }
        prevStatus.current = o?.status ?? null;
        if (o && FINAL.includes(o.status)) return;
      } catch {
        /* reintenta en el siguiente ciclo */
      }
      if (alive) timer = setTimeout(tick, 3000);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id]);

  // Mantiene la pantalla encendida mientras el pedido sigue en curso.
  const active = order && !FINAL.includes(order.status);
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock;
    const request = () => navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);

  if (order === undefined) {
    return <div className="mx-auto max-w-xl px-4 py-16 text-center text-lince-900/60">Cargando tu pedido...</div>;
  }
  if (order === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-3xl font-bold uppercase">No encontramos este pedido</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-lince-700 underline">Volver al menú</Link>
      </div>
    );
  }

  const ready = order.status === "listo";
  const cancelled = order.status === "cancelado";

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lince-800">
        <ArrowLeft size={16} /> Volver al menú
      </Link>

      <AnimatePresence mode="wait">
        <motion.section
          key={order.status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`relative overflow-hidden rounded-3xl p-6 text-white ${
            cancelled ? "bg-red-900" : ready ? "bg-lince-600" : "bg-lince-950"
          }`}
        >
          <div className="pattern-lynx absolute inset-0" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Tu número de pedido</p>
            <p className="font-display text-8xl font-extrabold leading-none tracking-wide text-arena-400">#{order.code}</p>
            <p className="mt-1 text-sm text-white/70">{order.customer_name} · {timeOf(order.created_at)} h</p>

            <div className="mt-5 border-t border-white/15 pt-4">
              {cancelled ? (
                <p className="flex items-center gap-2 font-display text-3xl font-bold uppercase"><XCircle /> Pedido cancelado</p>
              ) : ready ? (
                <>
                  <p className="font-display text-4xl font-extrabold uppercase leading-tight">¡Tu pedido está listo!</p>
                  <p className="mt-1 text-white/85">Pasa a la cafetería, di tu nombre o número y paga <b>{money(order.total)}</b> al recogerlo.</p>
                </>
              ) : order.status === "entregado" ? (
                <p className="font-display text-3xl font-bold uppercase">Pedido entregado. ¡Buen provecho!</p>
              ) : (
                <>
                  <p className="font-display text-3xl font-bold uppercase leading-tight">{STATUS[order.status].label}</p>
                  <p className="mt-1 text-sm text-white/75">
                    {order.ahead > 0
                      ? `Hay ${order.ahead} ${order.ahead === 1 ? "pedido" : "pedidos"} antes que el tuyo.`
                      : "Eres el siguiente en la fila de la cocina."}{" "}
                    Mantén esta pantalla abierta: te avisamos aquí.
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {!cancelled && <Stepper status={order.status} />}

      <section className="mt-8 rounded-3xl border border-lince-900/10 bg-white p-5">
        <h3 className="mb-2 font-display text-2xl font-bold uppercase tracking-wide">Tu pedido</h3>
        <ul className="divide-y divide-lince-900/10">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <span><b className="mr-2 text-lince-700">{it.qty}x</b>{itemLabel({ name: it.name, label: it.label })}</span>
              <span className="text-sm text-lince-900/70">{money(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        {order.notes && <p className="mt-2 rounded-lg bg-arena-100 px-3 py-2 text-sm">Nota: {order.notes}</p>}
        <div className="mt-3 flex items-end justify-between border-t border-lince-900/10 pt-3">
          <span className="flex items-center gap-2 text-sm text-lince-900/70"><Store size={16} /> Se paga en la cafetería</span>
          <span className="font-display text-4xl font-bold leading-none">{money(order.total)}</span>
        </div>
      </section>

      {(ready || order.status === "entregado") && !surveyed && <Survey orderId={order.id} onDone={() => setSurveyed(true)} />}
      {surveyed && (ready || order.status === "entregado") && (
        <p className="mt-6 rounded-2xl bg-lince-100 p-4 text-center font-semibold text-lince-800">Gracias por tu opinión.</p>
      )}
    </main>
  );
}
