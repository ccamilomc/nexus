-- Instrucciones escritas de los ejercicios de tríceps.
--
-- Octava tanda (17; van 280 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- El tríceps tiene un fallo que se repite en casi todos: el codo se mueve. Los
-- textos lo dicen cada vez, a propósito, porque es el que arruina el ejercicio.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Caminata del cangrejo',
   'Sentado con las manos apoyadas detrás y los pies en el suelo, sube la cadera y camina hacia adelante o hacia atrás.

Cuida: dejar caer la cadera. Se queda alta todo el recorrido.'),

  ('Extensión de tríceps',
   'De pie frente a la polea alta con los codos pegados al cuerpo, estira los brazos hacia abajo y vuelve sin mover los codos.

Cuida: separar los codos del costado. Ahí deja de ser tríceps y pasa a ser un empuje.'),

  ('Extensión de tríceps a un brazo',
   'Con una mancuerna sujeta por detrás de la cabeza con una mano, estira el brazo hacia arriba manteniendo el codo apuntando al techo.

Cuida: abrir el codo hacia el lado.'),

  ('Extensión de tríceps con cuerda',
   'En la polea alta con la cuerda, estira los brazos y separa las manos al final del recorrido.

Cuida: no separarlas. Ese último gesto es justo lo que aporta la cuerda frente a la barra.'),

  ('Extensión sobre la cabeza',
   'Con una mancuerna sujeta con las dos manos por detrás de la cabeza, estira los brazos hacia arriba.

Cuida: arquear la espalda. Aprieta el abdomen y lleva las costillas hacia abajo.'),

  ('Extensión sobre la cabeza con mancuernas',
   'Lo mismo con una mancuerna en cada mano, que deja que cada brazo trabaje por su cuenta.

Cuida: dejar que los codos se abran cuando cansa.'),

  ('Flexiones diamante',
   'Flexión con las manos juntas bajo el pecho, formando un triángulo con índices y pulgares.

Cuida: abrir los codos hacia los lados. Van pegados al cuerpo.'),

  ('Fondos',
   'Sujétate en las barras con el tronco vertical y baja hasta el ángulo recto. Mantente erguido para cargar el tríceps.

Cuida: inclinarte al frente. En cuanto te inclinas, el trabajo se va al pecho.'),

  ('Fondos asistidos',
   'Los mismos fondos en la máquina de asistencia, con las rodillas apoyadas.

Cuida: dejar que la plataforma te suba. Empuja tú.'),

  ('Fondos con peso',
   'Los fondos con un cinturón lastrado.

Cuida: añadir peso antes de tener el recorrido completo sin él.'),

  ('Fondos en banco',
   'De espaldas a un banco, con las manos en el borde y los pies al frente, baja doblando los codos y sube.

Cuida: separar la espalda del banco. Se baja pegado, o el hombro se resiente.'),

  ('Fondos en silla',
   'El mismo movimiento apoyándote en una silla.

Cuida: usar una silla con ruedas o que se pueda volcar. Comprueba antes de cargar el peso.'),

  ('Patada de tríceps',
   'Con el tronco inclinado y el codo alto pegado al costado, estira el brazo hacia atrás y vuelve.

Cuida: bajar el codo al estirar. El codo se queda arriba y sólo se mueve el antebrazo.'),

  ('Press de banca agarre cerrado',
   'Press de banca con las manos a la anchura de los hombros y los codos cerca del cuerpo.

Cuida: juntar tanto las manos que la muñeca acabe forzada.'),

  ('Press francés',
   'Tumbado con la barra sobre el pecho, baja hacia la frente doblando sólo los codos y vuelve a estirar.

Cuida: mover los hombros. Los brazos se quedan verticales y sólo se dobla el codo.'),

  ('Press francés con mancuernas',
   'Lo mismo con una mancuerna en cada mano, que deja bajar a los lados de la cabeza y es más amable con el codo.

Cuida: abrir los codos al bajar.'),

  ('Press francés con una mancuerna',
   'El press francés sujetando una sola mancuerna con las dos manos.

Cuida: dejar que el peso caiga hacia la cara. Baja por detrás de la frente.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
