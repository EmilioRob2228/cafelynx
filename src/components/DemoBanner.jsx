import { isDemo } from "../lib/api";

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="bg-arena-100 px-4 py-1.5 text-center text-xs font-medium text-lince-900">
      Modo demostración: los datos se guardan solo en este navegador. Conecta Supabase para el piloto.
    </div>
  );
}
