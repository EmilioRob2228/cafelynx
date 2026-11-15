import { Link, Outlet } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "./Logo.jsx";
import { DemoBanner } from "./DemoBanner.jsx";
import { CartSheet } from "./CartSheet.jsx";
import { useCart } from "../lib/cart.jsx";
import { useState } from "react";
import { money } from "../lib/format";

export default function ClientLayout() {
  const { count, total } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <header className="sticky top-0 z-30 bg-lince-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={44} />
            <div className="leading-none">
              <div className="font-display text-2xl font-extrabold uppercase tracking-wider">
                Cafe<span className="text-arena-500">LYNX</span>
              </div>
              <div className="mt-1 text-[11px] font-medium text-white/60">Cafetería 3 · TecNM Celaya</div>
            </div>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="relative hidden items-center gap-2 rounded-xl bg-arena-500 px-4 py-2.5 text-sm font-semibold text-lince-950 hover:bg-arena-400 md:flex"
          >
            <ShoppingBag size={18} />
            Mi pedido
            {count > 0 && <span className="rounded-full bg-lince-950 px-2 py-0.5 text-xs text-arena-400">{count}</span>}
          </button>
        </div>
      </header>

      <Outlet />

      {count > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setOpen(true)}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-2xl bg-lince-950 px-5 py-4 text-white shadow-xl shadow-lince-950/30 md:hidden"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-arena-500 px-2 text-sm font-bold text-lince-950">{count}</span>
            <span className="font-semibold">Ver mi pedido</span>
          </span>
          <span className="font-display text-2xl font-bold tracking-wide text-arena-400">{money(total)}</span>
        </motion.button>
      )}

      <CartSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}
