import { writeFileSync } from "node:fs";
import { MENU_SEED } from "../src/data/menuSeed.js";

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const rows = MENU_SEED.map((it, i) => {
  const options = q(JSON.stringify(it.options));
  const days = it.days ? `array[${it.days.join(",")}]` : "null";
  const desc = it.note ? q(it.note) : "null";
  return `  (${q(it.category)}, ${q(it.name)}, ${desc}, ${options}::jsonb, ${days}, ${i + 1})`;
});

const sql = `-- Menu inicial de la Cafeteria 3. Generado con: npm run gen:seed
-- Ejecutar una sola vez, despues de schema.sql.
insert into public.menu_items (category, name, description, options, days, sort)
select * from (values
${rows.join(",\n")}
) as v(category, name, description, options, days, sort)
where not exists (select 1 from public.menu_items);
`;
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`seed.sql generado con ${MENU_SEED.length} productos`);
