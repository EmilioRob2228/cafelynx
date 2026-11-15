import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteMenuItem, listMenu, saveMenuItem } from "../../lib/api";
import { money } from "../../lib/format";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Switch } from "../../components/ui/Switch.jsx";

const DAYS = [
  { n: 1, s: "L" },
  { n: 2, s: "M" },
  { n: 3, s: "X" },
  { n: 4, s: "J" },
  { n: 5, s: "V" },
  { n: 6, s: "S" },
  { n: 0, s: "D" },
];
const DAY_FULL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const field =
  "w-full rounded-xl border border-lince-900/15 bg-white px-3.5 py-2.5 text-base focus:border-lince-700 focus:outline-none";

const blank = (category = "") => ({
  name: "",
  category,
  description: "",
  options: [{ label: "", price: "" }],
  days: [],
  available: true,
});

function ItemForm({ initial, categories, onSave, onCancel }) {
  const [f, setF] = useState(() => ({
    ...initial,
    description: initial.description || "",
    days: initial.days || [],
    options: initial.options.map((o) => ({ label: o.label || "", price: String(o.price) })),
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setOpt = (i, patch) => setF((p) => ({ ...p, options: p.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
  const toggleDay = (n) => setF((p) => ({ ...p, days: p.days.includes(n) ? p.days.filter((d) => d !== n) : [...p.days, n] }));

  async function submit(e) {
    e.preventDefault();
    const name = f.name.trim();
    const category = f.category.trim();
    if (!name || !category) return setError("Escribe el nombre y la categoría.");
    const options = f.options.map((o) => ({ label: o.label.trim(), price: Number(o.price) }));
    if (options.some((o) => !Number.isFinite(o.price) || o.price < 0 || o.price === 0)) return setError("Cada opción necesita un precio mayor a 0.");
    if (options.length > 1) {
      if (options.some((o) => !o.label)) return setError("Si hay varias opciones, cada una necesita una etiqueta (ej. Chica, Grande).");
      if (new Set(options.map((o) => o.label)).size !== options.length) return setError("Las etiquetas no pueden repetirse.");
    }
    setBusy(true);
    try {
      await onSave({ ...f, name, category, description: f.description.trim(), options });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Nombre</span>
        <input className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Categoría</span>
        <input className={field} list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
        <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Aviso en la tarjeta <span className="font-normal text-lince-900/50">(opcional)</span></span>
        <input className={field} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ej. Solo martes y jueves" />
      </label>

      <div>
        <span className="mb-1 block text-sm font-semibold">Precios</span>
        <div className="space-y-2">
          {f.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              {f.options.length > 1 && (
                <input className={field} placeholder="Etiqueta (Chica, Grande...)" value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} />
              )}
              <input className={`${field} max-w-32`} type="number" inputMode="decimal" min="0" step="1" placeholder="$" value={o.price} onChange={(e) => setOpt(i, { price: e.target.value })} />
              {f.options.length > 1 && (
                <button type="button" onClick={() => setF((p) => ({ ...p, options: p.options.filter((_, j) => j !== i) }))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-lince-900/5" aria-label="Quitar opción">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setF((p) => ({ ...p, options: [...p.options, { label: "", price: "" }] }))} className="mt-2 text-sm font-semibold text-lince-700 underline">
          + Agregar otra opción de precio
        </button>
      </div>

      <div>
        <span className="mb-1 block text-sm font-semibold">Días que se vende <span className="font-normal text-lince-900/50">(ninguno = todos)</span></span>
        <div className="flex gap-1.5">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d.n}
              onClick={() => toggleDay(d.n)}
              aria-pressed={f.days.includes(d.n)}
              aria-label={DAY_FULL[d.n]}
              className={`h-10 w-10 rounded-full border text-sm font-bold ${f.days.includes(d.n) ? "border-lince-900 bg-lince-900 text-white" : "border-lince-900/15 bg-white"}`}
            >
              {d.s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button disabled={busy}>{busy ? "Guardando..." : "Guardar"}</Button>
      </div>
    </form>
  );
}

export default function MenuAdmin() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    listMenu().then(setItems).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set((items || []).map((i) => i.category))], [items]);
  const grouped = useMemo(() => categories.map((c) => ({ c, list: items.filter((i) => i.category === c) })), [items, categories]);

  async function toggle(item, available) {
    setItems((p) => p.map((x) => (x.id === item.id ? { ...x, available } : x)));
    try {
      await saveMenuItem({ ...item, available });
    } catch (e) {
      setError(e.message);
    }
    load();
  }

  async function save(item) {
    await saveMenuItem(item);
    setEditing(null);
    load();
  }

  async function remove(item) {
    try {
      await deleteMenuItem(item.id);
    } catch (e) {
      setError(e.message);
    }
    setDeleting(null);
    load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">Menú</h1>
          <p className="text-sm text-lince-900/60">Apaga un producto cuando se agote; los clientes lo verán como “Agotado”.</p>
        </div>
        <Button onClick={() => setEditing(blank(categories[0] || ""))}><Plus size={18} /> Nuevo producto</Button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!items && <p className="py-12 text-center text-lince-900/60">Cargando menú...</p>}

      {grouped.map(({ c, list }) => (
        <section key={c} className="mb-6">
          <h2 className="mb-2 font-display text-2xl font-bold uppercase tracking-wide text-lince-800">{c}</h2>
          <ul className="divide-y divide-lince-900/10 overflow-hidden rounded-2xl border border-lince-900/10 bg-white">
            {list.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`min-w-0 flex-1 ${it.available ? "" : "opacity-50"}`}>
                  <p className="truncate font-semibold">{it.name}</p>
                  <p className="truncate text-sm text-lince-900/60">
                    {it.options.map((o) => (o.label && o.label !== money(o.price) ? `${o.label} ${money(o.price)}` : money(o.price))).join(" · ")}
                    {it.days && ` · solo ${it.days.map((d) => DAY_FULL[d]).join(", ")}`}
                  </p>
                </div>
                <span className="hidden text-xs font-semibold text-lince-900/50 sm:block">{it.available ? "Disponible" : "Agotado"}</span>
                <Switch checked={it.available} onCheckedChange={(v) => toggle(it, v)} label={`Disponibilidad de ${it.name}`} />
                <button onClick={() => setEditing(it)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-lince-900/5" aria-label={`Editar ${it.name}`}><Pencil size={17} /></button>
                <button onClick={() => setDeleting(it)} className="grid h-10 w-10 place-items-center rounded-full text-red-700 hover:bg-red-50" aria-label={`Eliminar ${it.name}`}><Trash2 size={17} /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing?.id ? "Editar producto" : "Nuevo producto"}>
        {editing && <ItemForm key={editing.id || "new"} initial={editing} categories={categories} onSave={save} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar producto">
        <p className="mb-5">¿Eliminar <b>{deleting?.name}</b> del menú? Los pedidos anteriores conservan su registro.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => remove(deleting)}>Eliminar</Button>
        </div>
      </Modal>
    </main>
  );
}
