-- Instrucciones escritas de los ejercicios de espalda.
--
-- Tercera tanda (43; van 135 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- Aquí hay dos familias enormes —once dominadas y trece remos— donde lo que hace
-- falta no es repetir el movimiento sino decir **qué cambia**: el agarre, el
-- ángulo o para qué sirve la variante.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Ángel invertido',
   'Boca abajo con los brazos en cruz, súbelos del suelo y deslízalos por encima de la cabeza y de vuelta, como un ángel de nieve, sin que lleguen a apoyarse.

Cuida: levantar la barbilla. La cabeza sigue mirando al suelo.'),

  ('Aperturas con banda',
   'De pie con la banda sujeta con las dos manos y los brazos al frente, ábrelos hacia los lados juntando los omóplatos. Vuelve controlando.

Cuida: encoger los hombros hacia las orejas.'),

  ('Dominadas',
   'Cuélgate con las manos algo más abiertas que los hombros. Tira llevando los codos hacia las costillas hasta pasar la barbilla, y baja hasta estirar del todo.

Cuida: quedarte a media bajada. El recorrido completo es lo que hace la dominada.'),

  ('Dominadas agarre neutro',
   'Con las palmas enfrentadas en las asas paralelas, tira hasta el pecho. Es la versión más amable para el hombro y el codo.

Cuida: balancearte para arrancar.'),

  ('Dominadas asistidas',
   'Apoya las rodillas en la plataforma de la máquina y tira igual que en una dominada. Cuanto más peso pones, más te ayuda.

Cuida: dejar que la plataforma te suba en la bajada. Bajas tú, no la máquina.'),

  ('Dominadas commando',
   'Colócate en perpendicular bajo la barra, con las manos juntas y una delante de la otra. Sube llevando la cabeza a un lado y alterna el lado en cada repetición.

Cuida: girar el cuerpo. Lo que cambia de lado es la cabeza, no la cadera.'),

  ('Dominadas con peso',
   'Una dominada normal con un cinturón lastrado o una mancuerna sujeta entre los pies.

Cuida: añadir peso antes de tener ocho o diez limpias sin él.'),

  ('Dominadas con toalla',
   'Pasa una o dos toallas por la barra y agárralas a ellas en vez de a la barra. El agarre se lleva mucho más trabajo.

Cuida: esperar las mismas repeticiones. Aquí fallan antes las manos que la espalda, y es lo normal.'),

  ('Dominadas en L',
   'Cuélgate con las piernas estiradas al frente en ángulo recto y mantenlas ahí durante toda la subida y la bajada.

Cuida: dejar caer las piernas al cansarte. Si caen, se acabó la serie.'),

  ('Dominadas escapulares',
   'Colgado con los brazos estirados, sube el cuerpo unos centímetros juntando los omóplatos, sin doblar los codos.

Cuida: doblar los codos. En cuanto se doblan ya es una dominada.'),

  ('Dominadas negativas',
   'Ponte arriba con un salto o un apoyo y baja lo más despacio que puedas, entre tres y cinco segundos.

Cuida: soltarte al final. La última parte de la bajada es la que enseña.'),

  ('Elevaciones en T boca abajo',
   'Boca abajo con los brazos en cruz formando una T, súbelos juntando los omóplatos y baja despacio.

Cuida: tirar con la espalda baja. Suben los brazos, no el pecho.'),

  ('Elevaciones en Y boca abajo',
   'Boca abajo con los brazos estirados en diagonal formando una Y, súbelos y baja despacio.

Cuida: encoger los hombros. Los brazos suben largos.'),

  ('Encogimientos con mancuernas',
   'De pie con una mancuerna en cada mano, sube los hombros hacia las orejas y baja despacio.

Cuida: girar los hombros. El movimiento es recto, arriba y abajo.'),

  ('Encogimientos de hombros',
   'De pie con el peso colgando y los brazos estirados, sube los hombros hacia las orejas y aguanta un segundo arriba.

Cuida: doblar los codos para ayudarte.'),

  ('Face pull con banda',
   'Con la banda anclada a la altura de la cara, tira llevando las manos hacia las orejas y separando los codos. Termina con los omóplatos juntos.

Cuida: tirar hacia el pecho. Va a la cara, y de ahí el nombre.'),

  ('Flexiones escapulares',
   'En posición de flexión con los brazos estirados, baja el pecho unos centímetros juntando los omóplatos y vuelve a separarlos empujando.

Cuida: doblar los codos. Aquí se mueven sólo los omóplatos.'),

  ('Hiperextensiones',
   'En el banco, baja el tronco doblando la cadera y sube hasta quedar en línea con las piernas.

Cuida: pasar de la línea arqueando la espalda. Arriba se termina recto, no curvado.'),

  ('Jalón al pecho',
   'Sentado con los muslos sujetos, tira de la barra hasta la parte alta del pecho llevando los codos abajo y atrás. Vuelve controlando.

Cuida: echarte muy atrás y tirar con el impulso, y pasar la barra por detrás de la nuca.'),

  ('Jalón al pecho agarre abierto',
   'El mismo jalón con las manos bastante más abiertas, que carga más el dorsal ancho.

Cuida: acortar el recorrido. Abierto se llega menos abajo, pero la barra sigue tocando el pecho.'),

  ('Jalón al pecho agarre cerrado',
   'Con un agarre estrecho o en V, tira hasta el pecho pegando los codos al cuerpo. Trabaja más la parte central de la espalda.

Cuida: echar el tronco atrás para ganar recorrido.'),

  ('Jalón al pecho con banda',
   'Con la banda anclada arriba, arrodíllate y tira hacia el pecho separando las manos. Es el jalón de casa.

Cuida: ponerte muy cerca del anclaje. La banda tiene que tener tensión desde el principio.'),

  ('Natación',
   'Nadar a ritmo sostenido. Trabaja la espalda entera sin castigar las articulaciones.

Cuida: salir demasiado fuerte. La técnica se pierde antes que las ganas.'),

  ('Peso muerto desde rack',
   'Con la barra apoyada en los soportes a la altura de la rodilla, tira desde ahí. Al quitar la parte baja del recorrido se puede cargar más.

Cuida: aprovecharlo para mover más peso del que aguantas con la espalda recta.'),

  ('Postura del niño',
   'De rodillas, siéntate sobre los talones y estira los brazos al frente dejando caer el pecho hacia el suelo. Aguanta y respira.

Cuida: forzar. Esto es descanso, no un estiramiento a tirones.'),

  ('Pull-over en polea',
   'De pie frente a la polea alta con los brazos casi estirados, baja la barra en arco hasta los muslos.

Cuida: doblar los codos y convertirlo en un jalón.'),

  ('Remo con barra',
   'Con el tronco inclinado unos cuarenta y cinco grados y la espalda recta, tira de la barra hacia el ombligo llevando los codos atrás. Baja controlando.

Cuida: incorporarte al tirar. Si el tronco sube, el peso sobra.'),

  ('Remo con mancuerna',
   'Con una rodilla y una mano apoyadas en el banco, tira de la mancuerna hacia la cadera pegando el codo al cuerpo.

Cuida: girar el tronco para subirla más. Los hombros se quedan paralelos al suelo.'),

  ('Remo con pecho apoyado',
   'Con el pecho apoyado en el respaldo, tira de las asas hacia atrás juntando los omóplatos. El apoyo le quita a la espalda baja todo el trabajo.

Cuida: despegar el pecho del respaldo para tirar más. Ahí se pierde la ventaja del ejercicio.'),

  ('Remo con toalla',
   'Pasa una toalla alrededor de un poste firme, échate atrás con los brazos estirados y tira acercando el pecho.

Cuida: usar un anclaje que no aguante. Compruébalo antes de colgarte.'),

  ('Remo en el marco de la puerta',
   'Agarra el marco con las dos manos, echa el cuerpo atrás con los brazos estirados y tira hasta acercar el pecho.

Cuida: doblar la cadera. El cuerpo va recto de la cabeza a los pies.'),

  ('Remo en máquina',
   'Sentado con el pecho apoyado, tira de las asas hacia el cuerpo y vuelve despacio sin soltar del todo.

Cuida: dejar el asiento mal ajustado. Las asas tienen que quedar a la altura del pecho.'),

  ('Remo en polea a un brazo',
   'De lado a la polea, tira con una mano hacia la cadera y deja que el hombro se estire al volver.

Cuida: girar el tronco al tirar.'),

  ('Remo en polea baja',
   'Sentado con los pies apoyados y las rodillas algo flexionadas, tira del agarre al ombligo con la espalda recta. Vuelve dejando estirar el hombro.

Cuida: balancearte adelante y atrás. El tronco se queda quieto.'),

  ('Remo en T',
   'De pie sobre la plataforma con el tronco inclinado, tira de las asas hacia el pecho llevando los codos atrás.

Cuida: subir el tronco a la vez que el peso.'),

  ('Remo en TRX',
   'Con las cintas ajustadas, échate atrás con los brazos estirados y tira acercando el pecho a las manos. Cuanto más horizontal te pongas, más cuesta.

Cuida: dejar caer la cadera. El cuerpo va en línea.'),

  ('Remo inclinado con mancuernas',
   'Con el tronco inclinado y una mancuerna en cada mano, tira de las dos hacia la cadera pegando los codos al cuerpo.

Cuida: redondear la espalda al inclinarte.'),

  ('Remo Meadows',
   'Con un extremo de la barra en el anclaje, ponte de lado y agarra el otro extremo con una mano. Tira hacia la cadera con el tronco inclinado.

Cuida: girar la cadera para ayudarte.'),

  ('Remo Pendlay',
   'Con el tronco paralelo al suelo, cada repetición empieza y termina con la barra en el suelo. Tira rápido y devuélvela.

Cuida: subir el tronco al tirar. Aquí el tronco no se mueve nada, y es lo que lo diferencia del remo con barra.'),

  ('Ski erg',
   'De pie frente a la máquina, tira de las asas de arriba hacia abajo acompañando con el tronco y la cadera.

Cuida: tirar sólo con los brazos. El impulso sale de la cadera.'),

  ('Superman',
   'Boca abajo, levanta a la vez brazos, pecho y piernas unos centímetros y baja despacio.

Cuida: forzar el cuello mirando al frente. La mirada va al suelo.'),

  ('Superman sostenido',
   'La misma posición, pero aguantando arriba el tiempo marcado en vez de repetir.

Cuida: aguantar la respiración. Se respira todo el rato.'),

  ('Suspensión activa en barra',
   'Colgado con los brazos estirados, baja los hombros separándolos de las orejas y mantente ahí.

Cuida: colgarte muerto. La gracia está en mantener el hombro activo.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
