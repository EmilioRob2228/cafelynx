import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Logo } from "../../components/Logo.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { adminSignIn, isDemo } from "../../lib/api";
import { unlockAudio } from "../../lib/sound";

const field =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-arena-500 focus:outline-none";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    unlockAudio();
    try {
      await adminSignIn(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pattern-lynx grid min-h-dvh place-items-center bg-lince-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 text-white">
        <div className="mb-6 text-center">
          <Logo size={96} className="mx-auto" />
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wider">
            Panel <span className="text-arena-500">Cafetería</span>
          </h1>
          <p className="text-sm text-white/60">Acceso para el personal de la Cafetería 3</p>
        </div>
        <input className={field} type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required={!isDemo} />
        <input className={field} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {isDemo && <p className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70">Modo demostración: la contraseña es <b className="text-arena-400">lince</b>.</p>}
        {error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}
        <Button variant="accent" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" size={18} />} Entrar
        </Button>
        <Link to="/" className="block text-center text-sm text-white/60 hover:text-white">Ir al sitio de pedidos</Link>
      </form>
    </div>
  );
}
