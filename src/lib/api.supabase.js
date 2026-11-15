import { supabase } from "./supabase";

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const normalizeOrder = (o) => ({
  ...o,
  total: Number(o.total),
  items: (o.order_items || []).map((i) => ({
    name: i.name,
    label: i.option_label,
    price: Number(i.unit_price),
    qty: i.qty,
  })),
});

// ---- Cliente
export async function listMenu() {
  const rows = unwrap(await supabase.from("menu_items").select("*").order("sort").order("name"));
  return rows.map((r) => ({ ...r, options: r.options || [] }));
}

export async function createOrder({ name, notes, lines }) {
  const items = lines.map((l) => ({ item_id: l.itemId, label: l.label, qty: l.qty }));
  return unwrap(await supabase.rpc("create_order", { p_name: name, p_notes: notes, p_items: items }));
}

export async function getOrder(id) {
  return unwrap(await supabase.rpc("get_order", { p_id: id }));
}

export async function submitSurvey(orderId, { rating, ease, userType, comment }) {
  unwrap(
    await supabase.rpc("submit_survey", {
      p_order_id: orderId,
      p_rating: rating,
      p_ease: ease,
      p_user_type: userType,
      p_comment: comment,
    })
  );
}

// ---- Admin
export async function getAdminSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const ok = unwrap(await supabase.rpc("is_admin"));
  return ok ? { email: data.session.user.email } : null;
}

export async function adminSignIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Correo o contraseña incorrectos.");
  const session = await getAdminSession();
  if (!session) {
    await supabase.auth.signOut();
    throw new Error("Esta cuenta no tiene permisos de administrador.");
  }
  return session;
}

export async function adminSignOut() {
  await supabase.auth.signOut();
}

export async function listBoardOrders(sinceISO) {
  const rows = unwrap(
    await supabase
      .from("orders")
      .select("*, order_items(*)")
      .or(`status.in.(pendiente,preparando,listo),created_at.gte.${sinceISO}`)
      .order("created_at", { ascending: true })
  );
  return rows.map(normalizeOrder);
}

export async function listOrdersRange(fromISO, toISO) {
  const rows = unwrap(
    await supabase
      .from("orders")
      .select("*, order_items(*)")
      .gte("created_at", fromISO)
      .lt("created_at", toISO)
      .order("created_at", { ascending: true })
      .limit(10000)
  );
  return rows.map(normalizeOrder);
}

export async function listSurveysRange(fromISO, toISO) {
  return unwrap(
    await supabase
      .from("surveys")
      .select("*, orders(code)")
      .gte("created_at", fromISO)
      .lt("created_at", toISO)
      .order("created_at", { ascending: false })
  );
}

export async function setOrderStatus(id, status) {
  unwrap(await supabase.from("orders").update({ status }).eq("id", id));
}

export function subscribeOrders(callback) {
  const channel = supabase
    .channel("orders-board")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function saveMenuItem(item) {
  const row = {
    category: item.category,
    name: item.name,
    description: item.description || null,
    options: item.options,
    days: item.days && item.days.length ? item.days : null,
    available: item.available,
    sort: item.sort ?? 0,
  };
  if (item.id) unwrap(await supabase.from("menu_items").update(row).eq("id", item.id));
  else unwrap(await supabase.from("menu_items").insert(row));
}

export async function deleteMenuItem(id) {
  unwrap(await supabase.from("menu_items").delete().eq("id", id));
}
