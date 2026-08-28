-- Instrucciones escritas de los ejercicios de cuerpo completo.
--
-- Décima y última tanda (8). Con ésta quedan **los 303 ejercicios del catálogo
-- global** con instrucciones escritas; los tres que se quedan sin ellas son los
-- que se creó el usuario, y son suyos.
--
-- El formato y el porqué de las tres condiciones del `where` están en
-- `20260827200000_chest_exercise_instructions.sql`.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Balanceos de pierna',
   'Sujeto a un apoyo, balancea una pierna adelante y atrás, y después de lado a lado. Es calentamiento.

Cuida: forzar la amplitud en frío. Empieza corto y ve abriendo.'),

  ('Burpees',
   'De pie, baja las manos al suelo, lleva los pies atrás, haz una flexión, vuelve a acercarlos y salta.

Cuida: dejar caer la cadera en la flexión. Cuando cansa, es lo primero que se pierde.'),

  ('El mejor estiramiento del mundo',
   'Desde una zancada profunda, apoya en el suelo la mano de dentro y gira el tronco abriendo el otro brazo hacia el techo. Cambia de lado.

Cuida: hacerlo con prisa. Pide dos o tres respiraciones por lado.'),

  ('Gato y vaca',
   'A cuatro apoyos, alterna entre redondear la espalda hacia arriba y dejarla caer abriendo el pecho, siguiendo la respiración.

Cuida: forzar los extremos. Es movilidad, no un estiramiento.'),

  ('Giro de torso',
   'De pie con los pies fijos, gira el tronco de un lado a otro dejando que los brazos acompañen sueltos.

Cuida: girar a tirones. Es un movimiento suave, de calentamiento.'),

  ('Remo con banda',
   'Con la banda anclada al frente, tira hacia el ombligo llevando los codos atrás y juntando los omóplatos.

Cuida: encoger los hombros al tirar.'),

  ('Swing con kettlebell',
   'Con la kettlebell entre las piernas, échala atrás y lánzala al frente estirando la cadera con fuerza. La pesa sube por el impulso, no por los brazos.

Cuida: hacerlo como una sentadilla. Es un movimiento de cadera: ella empuja y los brazos sólo sujetan.'),

  ('Thruster',
   'Desde la sentadilla frontal, sube y aprovecha el impulso para empujar la barra por encima de la cabeza en un solo movimiento.

Cuida: partirlo en dos. La subida y el empuje van encadenados, y ahí está la gracia.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
