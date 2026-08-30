-- ============================================================================
-- Nexus · Nutrición — más frescos que se comen aquí
-- ============================================================================
-- Segunda tanda de la misma lista que empezó `20260828140000`. Aquella se quedó
-- en ocho porque la clave de demostración del USDA admite treinta peticiones por
-- hora y el volcado se cortó a medias.
--
-- Estos siete son fruta y verdura de plaza: maracuyá, piña, mora, naranja,
-- tomate, cebolla y zanahoria. Mismo origen —FoodData Central del USDA, dominio
-- público—, mismo criterio y mismos valores por 100 g de alimento crudo.
--
-- ¿Por qué se puede confiar en que son el alimento correcto?
--
-- Porque el volcado dejó de fiarse del primer resultado. En esta tanda, buscando
-- «sweetpotato» USDA devolvió **espárragos congelados** —con calorías válidas, o
-- sea que una comprobación de calorías no lo habría parado— y buscando arroz
-- integral cocido devolvió el crudo, que lleva 76,7 g de carbohidratos por cada
-- cien contra los 23 del cocido. Los dos se descartaron y no están aquí.
--
-- Ahora el script exige tres cosas: que el sustantivo de la búsqueda aparezca en
-- el nombre que devuelve USDA, que si se pidió `raw` o `cooked` venga eso mismo,
-- y que el nombre no traiga una parte de la planta que no se pidió —hojas,
-- semillas, piel, zumo—. Esa última es la que en su día dejó fuera las HOJAS del
-- boniato, que es lo que devolvía «sweet potato».
--
-- ¿Y que las cifras son coherentes?
--
-- Por la comprobación de Atwater: proteína y carbohidrato a 4 kcal el gramo,
-- grasa a 9, restando la fibra a 2 porque USDA la cuenta dentro de los
-- carbohidratos y aporta menos.
--
-- Cinco de los siete quedan dentro del mismo margen que los ocho ya publicados
-- (de −5,9 % a +8,6 %). **Maracuyá se va a −9,4 % y mora a −12,1 %**, y no es un
-- error de los datos: son los dos de más fibra de toda la lista —10,4 g y 5,3 g—
-- y ahí el factor de 2 kcal por gramo se queda largo, porque la fibra insoluble
-- no aporta casi nada. Sus calorías, 97 y 43, son las que publica cualquier
-- tabla para maracuyá y mora.
--
-- `on conflict do nothing`, como las anteriores: se puede volver a ejecutar sin
-- duplicar nada.
-- ----------------------------------------------------------------------------

insert into public.foods
  (id, user_id, name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g)
values
  ('b0000000-0000-4000-8000-000000000018', null, 'Maracuyá', 100, 'g', 97, 2.2, 23.4, 0.7, 10.4),
  ('b0000000-0000-4000-8000-000000000019', null, 'Piña', 100, 'g', 50, 0.54, 13.1, 0.12, 1.4),
  ('b0000000-0000-4000-8000-00000000001a', null, 'Mora', 100, 'g', 43, 1.39, 9.61, 0.49, 5.3),
  ('b0000000-0000-4000-8000-00000000001b', null, 'Naranja', 100, 'g', 47, 0.94, 11.8, 0.12, 2.4),
  ('b0000000-0000-4000-8000-00000000001c', null, 'Tomate', 100, 'g', 18, 0.88, 3.89, 0.2, 1.2),
  ('b0000000-0000-4000-8000-00000000001d', null, 'Cebolla', 100, 'g', 40, 1.1, 9.34, 0.1, 1.7),
  ('b0000000-0000-4000-8000-00000000001e', null, 'Zanahoria', 100, 'g', 41, 0.93, 9.58, 0.24, 2.8)
on conflict (id) do nothing;
