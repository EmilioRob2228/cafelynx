// Menu real de la Cafeteria 3. Cada producto tiene una o mas opciones de precio.
// Las opciones con varios precios usan el precio como etiqueta hasta que la cafeteria
// indique que significa cada una (se puede renombrar desde /admin/menu).
// days: dias de la semana en que se vende (0 = domingo ... 6 = sabado). null = todos.

const one = (price) => [{ label: "", price }];
const tiers = (...prices) => prices.map((p) => ({ label: `$${p}`, price: p }));

export const CATEGORIES = ["Tortas", "Tacos", "Generales", "Especiales"];

export const MENU_SEED = [
  // Tortas
  { category: "Tortas", name: "Torta de Jamón", options: one(45) },
  { category: "Tortas", name: "Torta de Salchicha", options: one(45) },
  { category: "Tortas", name: "Torta de Huevo", options: one(45) },
  { category: "Tortas", name: "Torta de Queso Blanco", options: one(45) },
  { category: "Tortas", name: "Torta de Milanesa", options: one(60) },
  { category: "Tortas", name: "Torta de Bistec", options: one(50) },
  { category: "Tortas", name: "Torta de Pastor", options: one(50) },
  { category: "Tortas", name: "Torta de Chorizo", options: one(50) },
  { category: "Tortas", name: "Torta Guacamaya", options: one(60) },
  { category: "Tortas", name: "Torta de Arrachera", options: one(65) },
  { category: "Tortas", name: 'Torta Especial "Lince"', options: one(65) },
  { category: "Tortas", name: "Torta de Carnitas", options: one(60), days: [2, 4], note: "Solo martes y jueves" },

  // Tacos
  { category: "Tacos", name: "Tacos de Bistec", options: one(50) },
  { category: "Tacos", name: "Tacos de Chorizo", options: one(50) },
  { category: "Tacos", name: "Tacos de Pastor", options: one(50) },

  // Generales
  { category: "Generales", name: "Hotdogs (orden de 2)", options: one(40) },
  { category: "Generales", name: "Quesadilla", options: tiers(25, 30, 35) },
  { category: "Generales", name: "Hamburguesa", options: one(45) },
  { category: "Generales", name: "Papas a la Francesa", options: one(50) },
  { category: "Generales", name: "Hamburguesa con papas", options: one(65) },
  { category: "Generales", name: "Hotdogs con tocino (2)", options: one(50) },
  { category: "Generales", name: "Club Sandwich", options: one(50) },
  { category: "Generales", name: "Molletes", options: tiers(50, 60, 75) },
  { category: "Generales", name: "Sandwich", options: tiers(30, 35) },
  { category: "Generales", name: "Ensaladas", options: tiers(65, 80) },
  { category: "Generales", name: "Malteadas", options: one(35) },
  { category: "Generales", name: "Banderillas", options: one(50) },
  { category: "Generales", name: "Chicken Bake", options: one(70) },
  { category: "Generales", name: "Dedos de Queso", options: one(65) },

  // Especiales
  { category: "Especiales", name: "Chilaquiles", options: tiers(65, 80) },
  { category: "Especiales", name: "Enchiladas (verdes o rojas)", options: one(65) },
  { category: "Especiales", name: "Enchiladas Suizas", options: one(65) },
  { category: "Especiales", name: "Burrito", options: one(45) },
  { category: "Especiales", name: "Tacos Dorados (pollo)", options: one(50) },
  { category: "Especiales", name: "Papa Rellena", options: one(65) },
  { category: "Especiales", name: "Carne Asada", options: one(70) },
  { category: "Especiales", name: "Filete de Pescado", options: one(70) },
  { category: "Especiales", name: "Milanesa", options: one(70) },
  { category: "Especiales", name: "Pechuga Asada (pollo)", options: one(70) },
];
