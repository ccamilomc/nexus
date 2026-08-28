-- Instrucciones escritas de los ejercicios de hombros.
--
-- Sexta tanda (27; van 245 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- **Aquí se ve por qué hace falta `user_id is null`.** Hay dos ejercicios
-- llamados «Face pull»: el del catálogo global, en polea, y uno que se creó el
-- usuario. Sin esa condición, esta migración escribiría dentro de un ejercicio
-- que no es suyo. Por eso son 27 y no 28.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Caminata a la pared',
   'En posición de flexión con los pies contra la pared, camina con las manos hacia atrás mientras los pies suben por la pared, hasta donde controles.

Cuida: subir más de lo que puedes bajar. Comprueba antes cómo vas a salir.'),

  ('Círculos de brazos',
   'De pie con los brazos en cruz, haz círculos pequeños hacia adelante y luego hacia atrás. Es calentamiento.

Cuida: hacer círculos enormes en frío. Empieza pequeño y ve abriendo.'),

  ('Contractora inversa',
   'Sentado de cara al respaldo, abre los brazos hacia atrás juntando los omóplatos, con los codos algo flexionados.

Cuida: encoger los hombros. Bajan mientras los brazos se abren.'),

  ('Cuerdas de batalla',
   'De pie en media sentadilla con una cuerda en cada mano, haz ondas alternando los brazos con el tronco firme.

Cuida: mover sólo los brazos. El impulso sale de las piernas y la cadera.'),

  ('Elevación frontal con disco',
   'De pie sujetando un disco con las dos manos, súbelo con los brazos estirados hasta la altura de los ojos y baja despacio.

Cuida: balancearte para arrancar. Si hace falta impulso, pesa demasiado.'),

  ('Elevaciones frontales',
   'De pie con una mancuerna en cada mano por delante de los muslos, súbelas al frente hasta la altura de los hombros.

Cuida: subir por encima de los hombros. A partir de ahí el que trabaja es el trapecio.'),

  ('Elevaciones frontales en polea',
   'De espaldas a la polea baja, sube el agarre al frente con el brazo estirado. La polea mantiene la tensión también abajo.

Cuida: separarte tanto de la polea que el peso te tire hacia atrás.'),

  ('Elevaciones laterales',
   'De pie con una mancuerna en cada mano, sube los brazos hacia los lados hasta la altura de los hombros, con los codos algo flexionados.

Cuida: coger impulso con la cadera, y subir por encima del hombro.'),

  ('Elevaciones laterales en máquina',
   'Sentado con los brazos contra las almohadillas, ábrelos hacia los lados hasta la altura de los hombros.

Cuida: empujar con las manos. La fuerza sale del codo hacia afuera.'),

  ('Elevaciones laterales en polea',
   'De lado a la polea baja, sube el brazo cruzando por delante del cuerpo hasta la altura del hombro.

Cuida: inclinar el tronco hacia el lado contrario para llegar más alto.'),

  ('Estiramiento de hombro cruzado',
   'Cruza un brazo por delante del pecho y empújalo con el otro a la altura del codo. Aguanta entre veinte y treinta segundos.

Cuida: tirar del codo doblado. El brazo que se estira va recto.'),

  ('Face pull',
   'Con la cuerda en la polea a la altura de la cara, tira llevando las manos hacia las orejas y separando los codos. Termina con los omóplatos juntos.

Cuida: tirar hacia el pecho. Va a la cara, y de ahí el nombre.'),

  ('Flexiones de pino',
   'En pino contra la pared, baja hasta rozar el suelo con la cabeza y empuja hasta estirar los brazos.

Cuida: intentarlas sin aguantar antes el pino quieto un buen rato.'),

  ('Flexiones de pino contra la pared',
   'Con los pies apoyados en la pared y las manos en el suelo, baja la cabeza hacia el suelo y empuja.

Cuida: separar mucho las manos de la pared. Cuanto más lejos, menos vertical y menos hombro.'),

  ('Flexiones pike',
   'En posición de flexión con la cadera muy alta, baja la cabeza hacia el suelo entre las manos y empuja.

Cuida: bajar el pecho como en una flexión normal. Aquí baja la cabeza.'),

  ('Flexiones pike con pies elevados',
   'La misma flexión pike con los pies en un banco, lo que acerca la posición a la vertical y carga más el hombro.

Cuida: perder la cadera alta al cansarte.'),

  ('Pájaros',
   'Con el tronco inclinado y una mancuerna en cada mano colgando, ábrelas hacia los lados juntando los omóplatos.

Cuida: subir el tronco al abrir, y doblar los codos hasta convertirlo en un remo.'),

  ('Pájaros en polea',
   'Con las poleas cruzadas a la altura de los hombros, abre los brazos hacia atrás describiendo un arco amplio.

Cuida: doblar los codos. Los brazos van casi estirados.'),

  ('Pájaros inclinado con mancuernas',
   'Sentado en el borde de un banco con el pecho sobre los muslos, abre las mancuernas hacia los lados.

Cuida: usar peso de más. Con el pecho apoyado no se puede hacer trampa, y se nota.'),

  ('Press Arnold',
   'Sentado con las mancuernas delante y las palmas hacia ti, gira las muñecas hacia afuera mientras empujas hacia arriba.

Cuida: girar cuando ya has subido. El giro y el empuje van a la vez.'),

  ('Press con landmine',
   'Con un extremo de la barra en el anclaje, sujeta el otro a la altura del hombro y empuja en diagonal hacia arriba y adelante.

Cuida: arquear la espalda para empujar más lejos.'),

  ('Press de hombro con mancuernas',
   'Sentado con la espalda apoyada, empuja las mancuernas desde la altura de los hombros hasta arriba sin llegar a chocarlas.

Cuida: arquear la espalda baja separándola del respaldo.'),

  ('Press de hombro de pie con mancuernas',
   'De pie con el abdomen apretado, empuja las mancuernas desde los hombros hasta arriba.

Cuida: usar las piernas para arrancar. Si hace falta impulso, es un push press.'),

  ('Press de hombro en máquina',
   'Ajusta el asiento hasta que las asas queden a la altura de los hombros y empuja hacia arriba.

Cuida: dejar el asiento demasiado alto, que obliga a encoger los hombros en cada repetición.'),

  ('Press militar',
   'De pie con la barra a la altura de la clavícula, empuja hasta arriba pasando la cabeza y termina con la barra sobre los hombros.

Cuida: arquear la espalda baja para compensar. Aprieta glúteos y abdomen antes de empujar.'),

  ('Push press',
   'Como el press militar, pero con una flexión corta de piernas para arrancar. Permite mover más peso.

Cuida: convertirlo en una sentadilla. El impulso es un gesto corto y rápido.'),

  ('Remo al mentón',
   'De pie con la barra colgando, sube los codos hacia arriba llevando la barra cerca del cuerpo hasta el pecho.

Cuida: subir por encima del pecho con agarre estrecho. Si el hombro molesta, abre las manos o sube menos.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
