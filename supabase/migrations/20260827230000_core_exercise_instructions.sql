-- Instrucciones escritas de los ejercicios de core.
--
-- Cuarta tanda (45; van 180 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- Core es el grupo donde el fallo típico importa más que el movimiento: casi
-- todos son fáciles de hacer y difíciles de hacer bien, y lo que separa una
-- plancha de una plancha inútil es la cadera. Por eso aquí el bloque «Cuida:»
-- suele decir **cuándo cortar la serie**, no sólo qué evitar.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Abdominales',
   'Boca arriba con las rodillas dobladas, despega los omóplatos del suelo llevando las costillas hacia la cadera. Baja despacio.

Cuida: tirar del cuello con las manos. Las manos sólo acompañan a la cabeza.'),

  ('Abdominales en banco declinado',
   'Con los pies sujetos en el banco inclinado hacia abajo, sube el tronco enrollando la espalda y baja controlando.

Cuida: subir hasta sentarte del todo. A partir de ahí trabaja el flexor de la cadera, no el abdomen.'),

  ('Abdominales en V',
   'Estirado boca arriba, sube a la vez tronco y piernas hasta juntar las manos con los pies. Baja sin llegar a apoyarte del todo.

Cuida: doblar las rodillas a escondidas para llegar. Mejor doblarlas a propósito e ir estirando con el tiempo.'),

  ('Balanceo hollow',
   'En posición hollow —espalda baja pegada al suelo, brazos y piernas estirados y algo levantados— balancéate hacia adelante y atrás sin perder la forma.

Cuida: despegar la espalda baja. En cuanto se arquea, se acabó la serie.'),

  ('Bandera del dragón',
   'Tumbado y sujeto a algo firme detrás de la cabeza, sube el cuerpo entero recto sobre los hombros y bájalo despacio sin doblar la cadera.

Cuida: intentarlo sin dominar antes el sostén hollow. Es de los más exigentes que existen.'),

  ('Bicho muerto',
   'Boca arriba con brazos y rodillas arriba en ángulo recto, estira a la vez el brazo de un lado y la pierna del contrario.

Cuida: arquear la espalda al estirar. Si se despega del suelo, no bajes tanto.'),

  ('Bicho muerto con banda',
   'El mismo movimiento sujetando una banda anclada detrás de la cabeza, que obliga a apretar más para no dejarse llevar.

Cuida: permitir que la banda te lleve los brazos hacia atrás.'),

  ('Caminata del oso',
   'A cuatro apoyos con las rodillas justo por encima del suelo, avanza moviendo a la vez la mano de un lado y el pie del contrario.

Cuida: subir la cadera. Se queda baja y quieta todo el recorrido.'),

  ('Crunch bicicleta',
   'Boca arriba, lleva el codo hacia la rodilla contraria alternando lados, sin apoyar los omóplatos entre repeticiones.

Cuida: ir rápido tirando del cuello. Es lento, y lo que gira es el tronco, no los codos.'),

  ('Crunch con disco',
   'Un abdominal normal sujetando un disco sobre el pecho o estirado detrás de la cabeza. Cuanto más lejos, más cuesta.

Cuida: coger peso antes de controlar el movimiento sin él.'),

  ('Crunch en polea',
   'De rodillas frente a la polea alta con la cuerda junto a la cabeza, enrolla la espalda llevando los codos hacia los muslos.

Cuida: tirar con los brazos o doblar la cadera. Lo que se dobla aquí es la columna.'),

  ('Crunch inverso',
   'Boca arriba con las rodillas dobladas, llévalas al pecho despegando la cadera del suelo. Baja despacio.

Cuida: coger impulso con las piernas. Lo que sube es la cadera, no las rodillas.'),

  ('Elevación de piernas colgado',
   'Colgado de la barra con las piernas estiradas, súbelas hasta la altura de la cadera o más. Baja controlando.

Cuida: usar el balanceo. Si te columpias, pasa a la versión con rodillas.'),

  ('Elevación de piernas tumbado',
   'Boca arriba con las manos bajo la cadera, sube las piernas estiradas hasta la vertical y bájalas sin que toquen el suelo.

Cuida: arquear la espalda baja al bajar. Baja sólo hasta donde puedas mantenerla pegada.'),

  ('Elevación de rodillas colgado',
   'Colgado de la barra, sube las rodillas hacia el pecho enrollando también la cadera. Es el paso previo a la elevación de piernas.

Cuida: subir sólo las rodillas dejando la cadera quieta.'),

  ('Elevación de rodillas en silla romana',
   'Apoyado en los antebrazos y con la espalda contra el respaldo, sube las rodillas hacia el pecho.

Cuida: encoger los hombros hacia las orejas. Empuja hacia abajo con los codos.'),

  ('Encogimiento de rodillas sentado',
   'Sentado con las manos apoyadas atrás y el tronco algo inclinado, acerca las rodillas al pecho y estira las piernas sin tocar el suelo.

Cuida: apoyar los pies entre repeticiones.'),

  ('Escaladores',
   'En posición de flexión, lleva una rodilla al pecho y alterna rápido.

Cuida: rebotar con la cadera arriba. La espalda se queda en línea todo el rato.'),

  ('Flexión lateral con mancuerna',
   'De pie con una mancuerna en una mano, inclínate hacia ese lado y vuelve a subir. Cambia de lado al terminar la serie.

Cuida: llevar peso en las dos manos. Así se anulan y no trabaja nada.'),

  ('Flexiones con toque de hombro',
   'Haz una flexión y, arriba, toca el hombro contrario con la mano. Alterna.

Cuida: girar la cadera al soltar la mano. Ahí está el trabajo: en no girar.'),

  ('Giro ruso',
   'Sentado con el tronco echado atrás y los pies elevados, lleva el balón de un lado al otro girando el tronco.

Cuida: mover sólo los brazos. Lo que gira es el tronco.'),

  ('Giro ruso con peso',
   'El mismo giro sujetando una mancuerna, tocando el suelo a cada lado si tu recorrido lo permite.

Cuida: redondear la espalda. El pecho se mantiene abierto.'),

  ('Gusano',
   'De pie, baja las manos al suelo y camina con ellas hasta la posición de flexión. Vuelve caminando con los pies hacia las manos.

Cuida: doblar mucho las rodillas al bajar. Cuanto más estiradas, más estira la parte de atrás.'),

  ('Leñador con banda',
   'Con la banda anclada arriba, tira en diagonal de arriba abajo cruzando el cuerpo, girando desde la cadera.

Cuida: tirar con los brazos. El giro sale de la cadera y del tronco.'),

  ('Leñador en polea',
   'El mismo movimiento en la polea, que da carga constante. Se puede hacer de arriba abajo o de abajo arriba.

Cuida: mover los pies. Se quedan clavados y gira el tronco.'),

  ('Medio burpee',
   'De pie, apoya las manos, lleva los pies atrás a posición de flexión, vuelve a acercarlos y levántate. Sin flexión ni salto.

Cuida: dejar caer la cadera al llevar los pies atrás.'),

  ('Perro de caza',
   'A cuatro apoyos, estira a la vez el brazo de un lado y la pierna del contrario hasta dejarlos en línea con la espalda.

Cuida: subir la pierna por encima de la cadera arqueando la espalda.'),

  ('Plancha',
   'Apoyado en antebrazos y puntas de los pies, mantén el cuerpo recto de la cabeza a los talones, apretando abdomen y glúteos.

Cuida: subir la cadera para descansar, o dejarla caer. Si se cae, corta y descansa de verdad.'),

  ('Plancha con salto de piernas',
   'En plancha, abre y cierra las piernas con pequeños saltos sin mover la cadera.

Cuida: que la cadera suba y baje con cada salto.'),

  ('Plancha con toque de hombro',
   'En plancha con los brazos estirados, toca el hombro contrario con una mano y alterna, sin que la cadera gire.

Cuida: abrir poco los pies. Cuanto más juntos, más difícil es no girar.'),

  ('Plancha de Copenhague',
   'De lado, con la pierna de arriba apoyada en un banco y la de abajo en el aire, sube la cadera hasta quedar en línea.

Cuida: empezar con la pierna estirada. Apoya primero la rodilla en el banco.'),

  ('Plancha del oso',
   'A cuatro apoyos con las rodillas justo por encima del suelo, aguanta quieto con la espalda plana.

Cuida: subir la cadera. En cuanto sube, deja de costar.'),

  ('Plancha lateral',
   'De lado, apoyado en un antebrazo y en el canto del pie, sube la cadera hasta quedar en línea y aguanta.

Cuida: dejar caer la cadera poco a poco. Cuando cae, se acabó el tiempo.'),

  ('Plancha lateral con caída de cadera',
   'Desde la plancha lateral, baja la cadera hasta rozar el suelo y vuelve a subirla.

Cuida: girar el cuerpo. Hombros y cadera se quedan apilados.'),

  ('Press Pallof con banda',
   'De lado a la banda anclada, sujétala con las dos manos en el pecho y estira los brazos al frente sin dejar que te gire.

Cuida: girar el tronco. Todo el ejercicio consiste en no girar.'),

  ('Press Pallof de rodillas',
   'El mismo press de rodillas, que quita la ayuda de las piernas y deja todo el trabajo al tronco.

Cuida: sentarte sobre los talones. La cadera va estirada.'),

  ('Press Pallof en polea',
   'De lado a la polea, con el agarre en el pecho, estira los brazos y vuelve resistiendo el giro.

Cuida: acercarte a la polea para que cueste menos. La distancia es la carga.'),

  ('Rueda abdominal',
   'De rodillas con la rueda bajo los hombros, rueda hacia adelante todo lo que puedas manteniendo la espalda plana, y vuelve.

Cuida: arquear la espalda baja. Llega sólo hasta donde puedas mantenerla plana.'),

  ('Sentadilla con extensión de piernas',
   'Desde la sentadilla, lleva las piernas atrás a posición de plancha y vuelve a acercarlas para subir.

Cuida: dejar caer la cadera al estirar las piernas.'),

  ('Sostén en L',
   'Apoyado en unos paralelos o en el suelo, levanta el cuerpo con las piernas estiradas al frente en ángulo recto y aguanta.

Cuida: encoger los hombros. Empuja hacia abajo para separarlos de las orejas.'),

  ('Sostén hollow',
   'Boca arriba con la espalda baja pegada al suelo, brazos y piernas estirados y algo levantados. Aguanta el tiempo marcado.

Cuida: despegar la espalda. Si se arquea, sube un poco los brazos y las piernas.'),

  ('Sostén Pallof en polea',
   'El press Pallof, pero aguantando los brazos estirados el tiempo marcado en vez de repetir.

Cuida: aguantar la respiración mientras aguantas la postura.'),

  ('Tijeras',
   'Boca arriba con las piernas estiradas y algo levantadas, crúzalas alternando arriba y abajo sin apoyar los talones.

Cuida: arquear la espalda baja. Sube algo las piernas si se despega.'),

  ('Toque de puntas',
   'Boca arriba con las piernas estiradas hacia el techo, sube el tronco intentando tocar las puntas de los pies.

Cuida: tirar del cuello. Lo que sube es el pecho, no la cabeza.'),

  ('Toque de talones',
   'Boca arriba con las rodillas dobladas y los omóplatos algo despegados, inclínate a un lado hasta tocar el talón y alterna.

Cuida: apoyar la cabeza entre repeticiones. Los hombros se quedan arriba todo el rato.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
