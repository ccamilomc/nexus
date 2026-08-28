-- Instrucciones escritas de los ejercicios de cardio.
--
-- Novena tanda (15; van 295 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- En cardio casi nadie necesita que le expliquen cómo se camina. Lo que aporta
-- el texto aquí es lo otro: **el detalle que hace que la máquina cuente o no**
-- —agarrarse al pasamanos de la caminadora, el orden del remo ergómetro— y el
-- ritmo al que conviene ir.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Bicicleta de asalto',
   'Pedalea empujando y tirando también con los brazos. La resistencia sube cuanto más fuerte vas, así que se regula sola.

Cuida: salir al máximo. En esta máquina el castigo llega antes de lo que parece.'),

  ('Bicicleta estática',
   'Ajusta el sillín para que la rodilla quede casi estirada abajo y pedalea al ritmo marcado.

Cuida: dejar el sillín bajo. Es lo que hace que acabe doliendo la rodilla en vez de cansarse la pierna.'),

  ('Caminadora',
   'Camina o corre al ritmo y la inclinación marcados.

Cuida: sujetarte al pasamanos. Agarrado, la inclinación deja de contar.'),

  ('Caminar',
   'Caminar a paso sostenido. Es el cardio que menos castiga y el más fácil de mantener en el tiempo.

Cuida: subestimarlo. Cuarenta minutos casi a diario cambian más que una sesión heroica al mes.'),

  ('Carrera continua',
   'Correr a un ritmo que te deje hablar, durante el tiempo marcado.

Cuida: correr siempre fuerte. El fondo se construye cómodo, no asfixiado.'),

  ('Desplazamiento lateral',
   'En media sentadilla, desplázate de lado con pasos rápidos y vuelve.

Cuida: cruzar los pies. Van paralelos y sin tocarse.'),

  ('Elíptica',
   'Pedalea acompañando con los brazos y el tronco erguido.

Cuida: cargar el peso en las manos. Los brazos acompañan; las que trabajan son las piernas.'),

  ('Escaladora',
   'Sube escalones al ritmo marcado, con el tronco erguido.

Cuida: colgarte del pasamanos. Ahí desaparece medio ejercicio.'),

  ('Remo ergómetro',
   'Empuja primero con las piernas, después echa el tronco atrás y por último tira con los brazos. Vuelve en el orden inverso.

Cuida: tirar primero con los brazos. El orden es piernas, tronco, brazos, y no al revés.'),

  ('Rodillas al pecho',
   'De pie y en el sitio, sube alternando las rodillas a la altura de la cadera, rápido.

Cuida: encorvarte hacia adelante. El tronco se queda erguido.'),

  ('Saltar la cuerda',
   'Salta con los pies juntos y saltos pequeños, girando la cuerda con las muñecas y no con los brazos.

Cuida: saltar alto. Basta con que pase la cuerda.'),

  ('Saltos de patinador',
   'Salta de lado de un pie al otro, llevando la pierna libre cruzada por detrás.

Cuida: aterrizar con la rodilla rígida o metida hacia dentro.'),

  ('Saltos de tijera',
   'Abre y cierra piernas y brazos a la vez, con un salto.

Cuida: aterrizar con las piernas rígidas. Las rodillas amortiguan.'),

  ('Senderismo',
   'Caminar por terreno irregular o en pendiente. Suma trabajo de piernas al cardio.

Cuida: bajar corriendo. La bajada es la que castiga la rodilla.'),

  ('Sprawl',
   'De pie, baja las manos al suelo, lanza los pies atrás hasta quedar tumbado y vuelve a levantarte.

Cuida: dejar caer la cadera al llegar abajo.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
