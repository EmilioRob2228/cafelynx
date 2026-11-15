import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Loader2, Store } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet } from "./ui/Sheet.jsx";
import { Button } from "./ui/Button.jsx";
import { useCart } from "../lib/cart.jsx";
import { createOrder } from "../lib/api";
import { money } from "../lib/format";
import { unlockAudio } from "../lib/sound";

const field =
  "w-full rounded-xl border border-lince-900/15 bg-white px-4 py-3 text-base text-lince-950 placeholder:text-lince-900/40 focus:border-lince-700 focus:outline-none";

export function CartSheet({ open, onOpenChange }) {
  const { lines, setQty, clear, total, count } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("cl_name") || "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (name.trim().length < 2) {
      setError("Escribe tu nombre para que te identifiquen al recoger.");
      return;
    }
    unlockAudio();
    setBusy(true);
    try {
      const res = await createOrder({ name, notes, lines });
      localStorage.setItem("cl_name", name.trim());
      localStorage.setItem("cl_last_order", JSON.stringify({ id: res.id, code: res.code }));
      clear();
      setNotes("");
      onOpenChange(false);
      navigate(`/pedido/${res.id}`);
    } catch (e) {
      setError(e.message || "No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const footer =
    count > 0 ? (
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-lince-900/70">Total a pagar en caja</span>
          <span className="font-display text-4xl font-bold leading-none">{money(total)}</span>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <Button variant="accent" size="lg" className="w-full" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          {busy ? "Enviando..." : "Confirmar pedido"}
        </Button>
      </div>
    ) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Tu pedido" footer={footer}>
      {count === 0 ? (
        <div className="py-12 text-center text-lince-900/60">
          <p className="font-display text-2xl font-semibold uppercase">Aún no hay nada</p>
          <p className="mt-1 text-sm">Agrega productos del menú para armar tu pedido.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <ul className="divide-y divide-lince-900/10 rounded-2xl bg-white px-4">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li
                  key={l.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between gap-3 overflow-hidden py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">{l.name}</p>
                    <p className="text-sm text-lince-900/60">
                      {l.label ? `${l.label} · ` : ""}
                      {money(l.price)} c/u
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-lince-50 p-1">
                    <button
                      onClick={() => setQty(l.key, l.qty - 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm"
                      aria-label="Quitar uno"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.key, l.qty + 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-lince-900 text-white"
                      aria-label="Agregar uno"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Tu nombre</span>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te llamamos al entregar" maxLength={60} autoComplete="given-name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Notas <span className="font-normal text-lince-900/50">(opcional)</span></span>
              <textarea className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sin cebolla, bien cocido, etc." maxLength={200} />
            </label>
          </div>

          <div className="flex gap-3 rounded-2xl bg-lince-900 p-4 text-sm text-white/90">
            <Store className="mt-0.5 shrink-0 text-arena-400" size={18} />
            <p>
              <span className="font-semibold text-white">El pago es en la cafetería.</span> Tu pedido se prepara con anticipación
              y lo pagas al recogerlo.
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
}
