-- El presupuesto de comida se va a finanzas.
--
-- Vivía aquí medido por semanas y sobre el **coste de lo comido**, mientras
-- finanzas lo mide por meses y sobre el **dinero que de verdad salió**. Eran dos
-- cifras para lo mismo que no cuadraban entre sí, y obligaban a mantener dos
-- números y a elegir cuál creer.
--
-- A partir de ahora el presupuesto de comida es el tope de su categoría en
-- `finance_budgets`, sobre desembolsos reales. Nutrición conserva el precio por
-- porción, que no es contabilidad sino un atributo del alimento para comparar
-- dos comidas (ver docs/04).
--
-- Se puede borrar sin red: **ninguna regla del Decision Engine la leía** —sólo
-- pintaba una tarjeta— y no hay dato que migrar, porque el tope equivalente lo
-- pone el usuario en finanzas con el periodo y la cifra que de verdad usa.

alter table public.nutrition_goals
  drop column if exists weekly_food_budget;
