-- ============================================================================
-- Nexus · Nutrición — los frescos que se comen aquí
-- ============================================================================
-- El catálogo global tenía quince alimentos y ninguno era de aquí: arroz, pollo,
-- huevo, avena, manzana. Nada de plátano, yuca, ñame ni guayaba, que es lo que
-- de verdad se cocina en una casa colombiana.
--
-- Los empaquetados ya están cubiertos por el catálogo de Open Food Facts que
-- Nexus lleva dentro (2.141 productos). Lo que faltaba era **la comida sin
-- código de barras**: la que se compra en la plaza y no trae etiqueta.
--
-- ¿De dónde salen las cifras?
--
-- De **FoodData Central del USDA**, que es dominio público. Se traen con
-- `node scripts/descargar-frescos.mjs`, que imprime junto a cada cifra el
-- nombre exacto del alimento en USDA para poder revisar que sea el que se
-- pidió — y hace falta: buscando «sweet potato» devolvió las *hojas* del
-- boniato, no el tubérculo, y ese se descartó.
--
-- La Tabla de Composición de Alimentos Colombianos del ICBF habría sido mejor
-- fuente, porque es de aquí. **No se puede usar**: sus PDF son escaneos de
-- imágenes, sin capa de texto, y sacar 773 filas de nutrientes por OCR pondría
-- números equivocados en el diario de alguien. Queda anotado por si algún día
-- la publican en un formato que se pueda leer.
--
-- Cada cifra pasó la comprobación de Atwater —proteína y carbohidrato a 4 kcal
-- el gramo, grasa a 9— contra las calorías declaradas. Las ocho cuadran.
--
-- Valores por 100 g de alimento crudo. `on conflict do nothing`, como la
-- semilla original: se puede volver a ejecutar sin duplicar nada.
-- ----------------------------------------------------------------------------

insert into public.foods
  (id, user_id, name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g)
values
  ('b0000000-0000-4000-8000-000000000010', null, 'Plátano verde', 100, 'g', 152, 1.25, 36.7, 0.07, 2.2),
  ('b0000000-0000-4000-8000-000000000011', null, 'Plátano maduro', 100, 'g', 122, 1.3, 31.9, 0.35, 1.7),
  ('b0000000-0000-4000-8000-000000000012', null, 'Yuca cruda', 100, 'g', 160, 1.36, 38.1, 0.28, 1.8),
  ('b0000000-0000-4000-8000-000000000013', null, 'Ñame crudo', 100, 'g', 118, 1.53, 27.9, 0.17, 4.1),
  ('b0000000-0000-4000-8000-000000000014', null, 'Guayaba', 100, 'g', 68, 2.55, 14.3, 0.95, 5.4),
  ('b0000000-0000-4000-8000-000000000015', null, 'Papaya', 100, 'g', 43, 0.47, 10.8, 0.26, 1.7),
  ('b0000000-0000-4000-8000-000000000016', null, 'Mango', 100, 'g', 60, 0.82, 15, 0.38, 1.6),
  ('b0000000-0000-4000-8000-000000000017', null, 'Aguacate', 100, 'g', 160, 2, 8.53, 14.7, 6.7)
on conflict (id) do nothing;
