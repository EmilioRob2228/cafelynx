import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList, LogOut, UtensilsCrossed } from "lucide-react";
import { Logo } from "../../components/Logo.jsx";
import { DemoBanner } from "../../components/DemoBanner.jsx";
import { adminSignOut, getAdminSession } from "../../lib/api";

const links = [
  { to: "/admin", end: true, label: "Pedidos", Icon: ClipboardList },
  { to: "/admin/menu", label: "Menú", Icon: UtensilsCrossed },
  { to: "/admin/estadisticas", label: "Estadísticas", Icon: BarChart3 },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    getAdminSession()
      .then((s) => (s ? setSession(s) : navigate("/admin/login", { replace: true })))
      .catch(() => navigate("/admin/login", { replace: true }));
  }, [navigate]);

  if (!session) return <div className="grid min-h-dvh place-items-center text-lince-900/60">Cargando...</div>;

  const logout = async () => {
    await adminSignOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <header className="sticky top-0 z-30 bg-lince-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="hidden font-display text-2xl font-extrabold uppercase tracking-wider sm:block">
              Cafe<span className="text-arena-500">LYNX</span> <span className="text-white/50">· Admin</span>
            </span>
          </div>
          <nav className="flex gap-1">
            {links.map(({ to, end, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                    isActive ? "bg-arena-500 text-lince-950" : "text-white/75 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10" aria-label="Cerrar sesión">
            <LogOut size={17} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
