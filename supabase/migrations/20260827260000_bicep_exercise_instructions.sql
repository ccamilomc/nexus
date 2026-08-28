-- Instrucciones escritas de los ejercicios de bíceps.
--
-- Séptima tanda (18; van 263 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- Son 18 y no 19 porque «Curl concentrado (unilateral)» se lo creó el usuario y
-- una migración no escribe en los datos de nadie.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Curl araña',
   'Con el pecho apoyado en un banco inclinado y los brazos colgando en vertical, sube las mancuernas sin mover los codos.

Cuida: separar el pecho del banco. Apoyado no hay forma de hacer trampa, que es justo la gracia.'),

  ('Curl con barra',
   'De pie con los codos pegados al cuerpo, sube la barra hasta el pecho y baja despacio hasta estirar.

Cuida: balancear la espalda para arrancar, y quedarte a media bajada.'),

  ('Curl concentrado',
   'Sentado con el codo apoyado por dentro del muslo, sube la mancuerna hasta el hombro y baja controlando.

Cuida: despegar el codo del muslo.'),

  ('Curl de arrastre',
   'Sube la barra arrastrándola por el torso, llevando los codos hacia atrás en vez de hacia adelante.

Cuida: separar la barra del cuerpo. Va rozando todo el recorrido, y en eso se diferencia del curl normal.'),

  ('Curl de bíceps',
   'De pie con una mancuerna en cada mano, sube alternando o a la vez, girando la palma hacia arriba mientras subes.

Cuida: adelantar los codos. Se quedan pegados al costado.'),

  ('Curl de muñeca',
   'Sentado con los antebrazos apoyados en los muslos y las palmas hacia arriba, sube la barra doblando sólo la muñeca.

Cuida: coger peso de más. Aquí el recorrido es de centímetros.'),

  ('Curl en polea',
   'De pie frente a la polea baja, sube el agarre hasta el pecho con los codos quietos. La tensión tampoco se pierde abajo.

Cuida: echar el tronco atrás para ayudarte.'),

  ('Curl inclinado con mancuernas',
   'Sentado en un banco inclinado con los brazos colgando por detrás del cuerpo, sube las mancuernas. La posición estira más el bíceps.

Cuida: adelantar los hombros al subir. Se quedan atrás, que es lo que hace distinto a este curl.'),

  ('Curl inverso',
   'Con la barra agarrada por encima, sube igual que en un curl normal.

Cuida: esperar el mismo peso que en el curl normal. Aquí se levanta bastante menos, y es lo normal.'),

  ('Curl martillo',
   'Con las palmas enfrentadas, sube las mancuernas sin girar la muñeca.

Cuida: girar la mano al subir. En cuanto gira, es un curl normal.'),

  ('Curl martillo con cuerda',
   'Con la cuerda en la polea baja y las palmas enfrentadas, sube hasta el pecho manteniendo el agarre firme.

Cuida: separar las manos al subir.'),

  ('Curl predicador',
   'Con la parte de atrás de los brazos apoyada en el atril, sube y baja hasta estirar casi del todo.

Cuida: soltar de golpe al final. Ahí es donde el codo se lleva el tirón.'),

  ('Dominadas supinas',
   'Cuélgate con las palmas hacia ti y las manos a la anchura de los hombros. Tira hasta pasar la barbilla.

Cuida: quedarte a media bajada. Abajo se estira del todo.'),

  ('Dominadas supinas asistidas',
   'La misma dominada supina en la máquina de asistencia. Cuanto más peso pones, más te ayuda.

Cuida: dejar que la plataforma te suba en la bajada.'),

  ('Dominadas supinas con peso',
   'La dominada supina con un cinturón lastrado o una mancuerna sujeta entre los pies.

Cuida: añadir peso antes de tener ocho o diez limpias sin él.'),

  ('Extensión de muñeca',
   'Sentado con los antebrazos en los muslos y las palmas hacia abajo, sube el peso doblando sólo la muñeca.

Cuida: usar peso de más. El recorrido es corto y el antebrazo, pequeño.'),

  ('Paseo del granjero',
   'Camina con una mancuerna pesada en cada mano, los hombros abajo y el tronco erguido, la distancia o el tiempo marcados.

Cuida: encoger los hombros. Van bajos y atrás.'),

  ('Suspensión en barra',
   'Cuélgate de la barra con los brazos estirados y aguanta el tiempo marcado. Lo que trabaja es el agarre.

Cuida: soltarte de golpe. Baja apoyando los pies.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
