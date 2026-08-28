-- Instrucciones escritas de los ejercicios de pecho.
--
-- La columna `instructions` existe desde `20260723120200_init_workout.sql` y
-- nunca se llenó: los 306 ejercicios del catálogo la tienen en blanco. El dibujo
-- enseña la postura; el texto explica los fallos, que es lo que el dibujo no
-- puede decir.
--
-- Formato, igual en todos: **cómo se hace** en dos frases y, tras una línea en
-- blanco, **«Cuida:»** con el error que de verdad se comete. Nada de listas de
-- ocho pasos, que en el gimnasio no se leen.
--
-- Tres condiciones en el `where`, y las tres importan:
--
--   * `e.user_id is null` — sólo el catálogo global. Un ejercicio que se creó el
--     usuario es suyo y una migración no escribe en los datos de nadie.
--   * `e.instructions is null` — no pisa lo ya escrito, así que volver a
--     aplicarla no deshace correcciones posteriores.
--   * el nombre — es la clave real del catálogo aquí, como en el mapa de
--     ilustraciones de `constants/illustrations.ts`.
--
-- Esta tanda es pecho (26 de 306). El resto de grupos van en migraciones
-- aparte, por tandas, para poder revisar la redacción antes de seguir.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Aperturas con mancuernas',
   'Tumbado en el banco, sube las mancuernas sobre el pecho con los codos algo flexionados. Ábrelas en arco hasta notar el estiramiento y júntalas por el mismo camino.

Cuida: bajar más de lo que aguanta el hombro, y doblar los codos hasta convertirlo en un press.'),

  ('Contractora de pecho',
   'Siéntate con la espalda pegada al respaldo y los antebrazos en las almohadillas, a la altura del pecho. Junta los brazos por delante sin encoger los hombros.

Cuida: soltar de golpe al volver. La vuelta es la mitad del ejercicio.'),

  ('Cruce de poleas',
   'Con las poleas altas y un paso al frente, agarra las asas con los codos algo flexionados. Cruza las manos por delante del pecho y vuelve controlando el arco.

Cuida: encoger los hombros, y tirar con los brazos rectos como si fueran una barra.'),

  ('Cruce de poleas inclinado',
   'Con las poleas bajas, sube las manos en diagonal hasta juntarlas a la altura de la clavícula. Vuelve por el mismo arco sin dejar que el peso tire del hombro.

Cuida: arrancar cada repetición con el impulso de las piernas.'),

  ('Estiramiento de pecho en el marco de la puerta',
   'Apoya el antebrazo en el marco con el codo a la altura del hombro y gira el cuerpo despacio hacia el lado contrario. Aguanta entre veinte y treinta segundos y cambia de lado.

Cuida: forzar hasta que duela. Tiene que tirar, no molestar.'),

  ('Flexiones',
   'Manos algo más abiertas que los hombros y cuerpo en línea recta de la cabeza a los talones. Baja hasta dejar el pecho a un palmo del suelo y empuja.

Cuida: dejar caer la cadera, y sacar el cuello antes que el pecho.'),

  ('Flexiones abiertas',
   'Como la flexión normal pero con las manos bastante más abiertas. El recorrido es más corto y el pecho se lleva más trabajo que el tríceps.

Cuida: abrir tanto que los hombros queden forzados. Si molestan, cierra un poco.'),

  ('Flexiones con manos elevadas',
   'Apoya las manos en un banco o un escalón, con el cuerpo en línea. Cuanto más alto el apoyo, menos peso levantas.

Cuida: saltar al suelo de golpe. Es la versión para coger fuerza: baja la altura poco a poco.'),

  ('Flexiones con peso',
   'Una flexión normal con un disco o una mochila apoyados en la espalda alta, nunca en la zona lumbar. Necesitas que alguien te lo coloque, o un chaleco.

Cuida: añadir peso antes de que salgan limpias sin él.'),

  ('Flexiones con pies elevados',
   'Pies en un banco y manos en el suelo. Al inclinar el cuerpo, la parte alta del pecho y los hombros se llevan más trabajo.

Cuida: dejar caer la cadera. Cuanto más alto el apoyo, más cuesta mantener la línea.'),

  ('Flexiones de arquero',
   'Con las manos muy abiertas, baja hacia un lado doblando ese brazo y dejando el otro estirado. Sube y alterna.

Cuida: girar la cadera para ayudarte. El pecho se queda mirando al suelo.'),

  ('Flexiones de rodillas',
   'La flexión apoyando las rodillas en vez de los pies, con el cuerpo recto de la cabeza a las rodillas. Es el paso previo a la flexión completa.

Cuida: sentarte sobre los talones. La cadera va estirada.'),

  ('Flexiones en pared',
   'De pie frente a una pared, manos a la altura del pecho y cuerpo en línea. Acércate doblando los codos y empuja.

Cuida: quedarte aquí. Cuando salgan quince fáciles, pasa a las de manos elevadas.'),

  ('Flexiones explosivas',
   'Baja como en una flexión normal y sube con fuerza suficiente para que las manos despeguen del suelo. Aterriza con los codos blandos.

Cuida: hacerlas cansado. El aterrizaje es donde se resiente la muñeca.'),

  ('Flexiones hindúes',
   'Empieza con la cadera alta y las manos y los pies apoyados. Baja el pecho pasando cerca del suelo y termina con el pecho arriba y la cadera baja; vuelve por el mismo camino.

Cuida: forzar la zona lumbar al final del recorrido.'),

  ('Flexiones typewriter',
   'Con las manos muy abiertas, baja al centro y desplázate de un lado al otro sin subir. Sube sólo al terminar el recorrido.

Cuida: perder la línea del cuerpo mientras te desplazas.'),

  ('Fondos en paralelas',
   'Sujétate en las barras con los brazos estirados y baja hasta que los codos formen un ángulo recto. Inclina algo el tronco al frente para cargar el pecho.

Cuida: bajar más de la cuenta. El hombro paga la diferencia.'),

  ('Press de banca',
   'Túmbate con los pies apoyados y los omóplatos juntos contra el banco. Baja la barra hasta rozar el pecho y empuja hasta estirar los brazos sin bloquear del todo.

Cuida: rebotar la barra en el pecho, y despegar la espalda del banco para poder subirla.'),

  ('Press de banca con mancuernas',
   'Con una mancuerna en cada mano sobre el pecho, baja hasta la altura del torso y sube juntándolas un poco. Permite más recorrido que la barra.

Cuida: dejar que se vayan hacia atrás. Van sobre el pecho, no sobre la cara.'),

  ('Press de banca en máquina Smith',
   'El movimiento del press de banca con la barra guiada. Coloca el banco de forma que la barra caiga justo sobre el pecho.

Cuida: colocar mal el banco. La guía no te deja corregir la trayectoria a medias.'),

  ('Press de pecho en máquina',
   'Ajusta el asiento hasta que las asas queden a la altura del pecho, con la espalda apoyada. Empuja al frente y vuelve despacio.

Cuida: dejar el asiento demasiado bajo. Ahí el trabajo se va a los hombros.'),

  ('Press declinado con barra',
   'Con el banco inclinado hacia abajo y las piernas sujetas, baja la barra a la parte baja del pecho y empuja.

Cuida: incorporarte de golpe al terminar la serie. Sal despacio.'),

  ('Press declinado con mancuernas',
   'Mismo banco declinado, una mancuerna en cada mano. Baja a la altura del pecho bajo y sube sin llegar a chocarlas.

Cuida: subirlas tirando con la espalda antes de tumbarte. Ayúdate con las rodillas.'),

  ('Press inclinado con barra',
   'Con el banco entre treinta y cuarenta y cinco grados, baja la barra a la parte alta del pecho y empuja. Carga sobre todo el pecho superior.

Cuida: pasar de cuarenta y cinco grados. A partir de ahí el que trabaja es el hombro.'),

  ('Press inclinado con mancuernas',
   'Mismo banco inclinado, una mancuerna en cada mano, que dejan bajar algo más. Sube juntándolas sin llegar a chocarlas.

Cuida: abrir los codos del todo. Deja un ángulo cómodo para el hombro.'),

  ('Seal jacks',
   'De pie, abre y cierra los brazos al frente a la vez que abres y cierras las piernas con un salto pequeño. Es un calentamiento, no un ejercicio de fuerza.

Cuida: buscar velocidad antes que amplitud. Lo que interesa es abrir el pecho.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
