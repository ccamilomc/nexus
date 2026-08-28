-- Instrucciones escritas de los ejercicios de piernas.
--
-- Segunda tanda (66 de 306). El formato y el porqué de las tres condiciones del
-- `where` están explicados en `20260827200000_chest_exercise_instructions.sql`,
-- que es la primera: cómo se hace en dos frases, línea en blanco, y «Cuida:»
-- con el error que de verdad se comete.
--
-- Es el grupo más grande del catálogo, y el que más variantes tiene de lo mismo:
-- ahí el texto sirve sobre todo para decir **en qué se diferencia** esta versión
-- de la de al lado, que es lo que el dibujo no puede explicar.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Aductores en máquina',
   'Siéntate con los muslos por dentro de las almohadillas. Cierra las piernas juntándolas y vuelve despacio hasta la apertura.

Cuida: abrir más de lo cómodo al volver. El estiramiento se gana poco a poco.'),

  ('Aductores en polea de pie',
   'De pie y de lado a la polea baja, con la tobillera en la pierna de dentro. Cruza esa pierna por delante de la otra y vuelve controlando.

Cuida: girar el tronco para ayudarte. El movimiento sale de la cadera.'),

  ('Bajada controlada desde el cajón',
   'Sube al cajón con las dos piernas y baja con una sola, muy despacio, hasta tocar el suelo. Sube otra vez con las dos.

Cuida: dejarte caer. Todo el trabajo está en la bajada lenta.'),

  ('Buenos días con barra',
   'Con la barra en la espalda alta y las rodillas algo flexionadas, echa la cadera atrás bajando el tronco hasta notar los isquiotibiales. Sube apretando los glúteos.

Cuida: redondear la espalda, y empezar con más peso del que controlas. Aquí se usa poco.'),

  ('Caminata de talones tumbado',
   'Boca arriba, rodillas dobladas y cadera levantada, camina alternando los talones hacia adelante sin bajar la cadera.

Cuida: dejar caer la cadera al estirar la pierna.'),

  ('Curl femoral',
   'Coloca la almohadilla justo encima del talón. Dobla la rodilla llevando el talón hacia el glúteo y vuelve despacio.

Cuida: levantar la cadera para llegar más arriba.'),

  ('Curl femoral con balón',
   'Boca arriba con los talones sobre el balón y la cadera levantada, dobla las rodillas rodando el balón hacia ti y estíralas de vuelta.

Cuida: bajar la cadera mientras ruedas. En cuanto baja, el ejercicio deja de trabajar.'),

  ('Curl femoral con toalla',
   'Boca arriba con los talones sobre una toalla en suelo liso y la cadera levantada, desliza los pies hacia ti y vuelve a estirarlos.

Cuida: hacerlo sobre una superficie que agarre. Sin deslizamiento no hay ejercicio.'),

  ('Curl femoral sentado',
   'Sentado con la almohadilla sobre los tobillos y las piernas estiradas, dobla las rodillas hacia abajo y vuelve controlando.

Cuida: separar la espalda del respaldo al empujar.'),

  ('Curl femoral tumbado',
   'Boca abajo con la almohadilla encima de los talones, lleva los talones hacia el glúteo y baja despacio.

Cuida: despegar la cadera de la camilla para llegar más arriba.'),

  ('Curl nórdico',
   'De rodillas con los tobillos sujetos, baja el cuerpo al frente lo más despacio que puedas, recto de rodillas a hombros. Amortigua con las manos.

Cuida: doblar la cadera. El cuerpo baja en bloque.'),

  ('Elevación de gemelos',
   'Con la punta del pie en el escalón, baja el talón hasta notar el estiramiento y sube lo más alto que puedas.

Cuida: rebotar abajo. Aguanta un segundo arriba.'),

  ('Elevación de gemelos a una pierna',
   'Sobre una pierna, con la punta en un escalón y una mano de apoyo, sube y baja el talón en todo su recorrido.

Cuida: colgarte del apoyo. La mano es para el equilibrio, no para tirar.'),

  ('Elevación de gemelos en prensa',
   'Apoya sólo la punta de los pies en la parte baja de la plataforma y empuja estirando el tobillo.

Cuida: bloquear las rodillas del todo, y poner los pies tan abajo que se escapen.'),

  ('Elevación de gemelos sentado',
   'Sentado con la almohadilla sobre las rodillas y la punta de los pies en el escalón, sube y baja el talón despacio.

Cuida: pasar rápido por abajo. Sentado trabaja el sóleo, y necesita el recorrido entero.'),

  ('Elevación de gemelos sin peso',
   'De pie, sube a la punta de los pies y baja despacio. Sirve de calentamiento o para muchas repeticiones.

Cuida: quedarte a media altura. Sin peso, el recorrido es lo único que tienes.'),

  ('Elevación de gemelos tipo burro',
   'Inclinado hacia adelante con el tronco apoyado y la carga sobre la cadera, sube y baja el talón con la punta en el escalón.

Cuida: doblar las rodillas para ayudarte.'),

  ('Estiramiento de cuádriceps de pie',
   'Dobla una rodilla y sujeta el pie por detrás llevando el talón al glúteo, con las rodillas juntas. Aguanta entre veinte y treinta segundos.

Cuida: arquear la espalda. Mete la cadera y el estiramiento aparece solo.'),

  ('Estiramiento de flexor de cadera de rodillas',
   'Una rodilla en el suelo y la otra pierna al frente en ángulo recto. Empuja la cadera hacia adelante sin arquear la espalda.

Cuida: adelantar la rodilla en vez de la cadera.'),

  ('Estiramiento de gemelos en pared',
   'Manos en la pared, una pierna atrás con la rodilla estirada y el talón pegado al suelo. Acerca la cadera a la pared.

Cuida: levantar el talón. Si se levanta, acorta el paso.'),

  ('Estiramiento de isquiotibiales',
   'Con una pierna estirada, inclínate hacia adelante desde la cadera hasta notar la parte de atrás del muslo.

Cuida: redondear la espalda para llegar más lejos. Va el pecho al frente, no la cabeza.'),

  ('Estiramiento de mariposa',
   'Sentado con las plantas de los pies juntas, deja caer las rodillas hacia los lados y acerca los talones al cuerpo.

Cuida: empujar las rodillas con fuerza. Deja que bajen solas.'),

  ('Extensión de cuádriceps',
   'Sentado con la almohadilla sobre los tobillos, estira las rodillas hasta arriba y baja despacio.

Cuida: bloquear de golpe arriba, y soltar el peso de vuelta.'),

  ('Flexión hacia adelante sentado',
   'Sentado con las piernas estiradas y juntas, inclínate desde la cadera llevando el pecho hacia los muslos.

Cuida: forzar a tirones. Es un estiramiento sostenido, no un rebote.'),

  ('Peso muerto',
   'Con la barra pegada a las espinillas, agárrala con la espalda recta y el pecho arriba. Sube empujando el suelo con los pies y estirando cadera y rodillas a la vez.

Cuida: redondear la espalda baja, y separar la barra del cuerpo. Va rozando la pierna todo el camino.'),

  ('Peso muerto con barra hexagonal',
   'De pie dentro de la barra, agarra las asas laterales y sube con la espalda recta. Al quedar el peso a los lados, la espalda trabaja menos que con la barra recta.

Cuida: empezar con la cadera demasiado baja, como si fuera una sentadilla.'),

  ('Peso muerto rumano',
   'De pie con la barra y las rodillas algo flexionadas y fijas, echa la cadera atrás bajando la barra pegada a la pierna hasta notar los isquiotibiales. Sube apretando los glúteos.

Cuida: doblar las rodillas para bajar más. Aquí manda la cadera, no la rodilla.'),

  ('Peso muerto rumano con kettlebell',
   'El mismo movimiento con una kettlebell sujeta con las dos manos, que va rozando las piernas al bajar.

Cuida: separar la pesa del cuerpo. En cuanto se aleja, la carga se va a la espalda baja.'),

  ('Peso muerto rumano con landmine',
   'Con un extremo de la barra en el anclaje y el otro sujeto con las dos manos, echa la cadera atrás siguiendo el arco que describe la barra.

Cuida: pelearte con ese arco. La barra hace una curva y hay que dejarla.'),

  ('Peso muerto rumano con mancuernas',
   'Una mancuerna en cada mano por delante de los muslos, rodillas algo flexionadas, cadera atrás y bajada pegada a la pierna.

Cuida: mirar al frente forzando el cuello. La mirada baja con el tronco.'),

  ('Peso muerto rumano en máquina Smith',
   'El mismo movimiento con la barra guiada. Colócate de forma que la barra baje rozando la pierna.

Cuida: quedarte lejos de la guía. Ahí la barra se separa y tira de la espalda.'),

  ('Peso muerto sumo',
   'Pies muy abiertos y puntas hacia afuera, manos por dentro de las piernas. Baja la cadera y sube empujando el suelo con las rodillas abiertas.

Cuida: juntar las rodillas al subir.'),

  ('Peso muerto sumo con mancuernas',
   'Postura de sumo con una mancuerna sujeta con las dos manos entre las piernas. Baja llevando la cadera atrás y sube estirando.

Cuida: convertirlo en una sentadilla. La cadera va hacia atrás, no sólo hacia abajo.'),

  ('Pies rápidos',
   'De pie, alterna los pies en el sitio lo más rápido que puedas, con pasos cortos y sin levantarlos mucho. Es calentamiento.

Cuida: buscar altura en vez de frecuencia.'),

  ('Prensa de piernas',
   'Pies a la anchura de los hombros en la plataforma. Baja hasta que las rodillas formen un ángulo recto y empuja sin bloquear del todo.

Cuida: bajar tanto que la cadera se despegue del asiento. Ahí es donde se resiente la espalda baja.'),

  ('Sentadilla',
   'Con la barra en la espalda alta y los pies a la anchura de los hombros, baja echando la cadera atrás y abriendo las rodillas hasta que el muslo quede paralelo al suelo. Sube empujando con todo el pie.

Cuida: meter las rodillas hacia adentro, y levantar los talones.'),

  ('Sentadilla a una pierna',
   'Sobre una pierna, con la otra estirada al frente, baja todo lo que puedas manteniendo el talón en el suelo y sube.

Cuida: intentarla sin la movilidad necesaria. Empieza por la versión asistida.'),

  ('Sentadilla a una pierna al cajón',
   'Igual, pero sentándote en un cajón y levantándote de él. Cuanto más alto el cajón, más fácil.

Cuida: dejarte caer en el cajón. Toca y sube.'),

  ('Sentadilla a una pierna asistida',
   'Sujétate a una anilla o al marco de una puerta y baja sobre una pierna, usando las manos sólo lo justo.

Cuida: tirar con los brazos. Son para el equilibrio.'),

  ('Sentadilla búlgara',
   'Con el pie de atrás sobre un banco y el de delante bien adelantado, baja hasta que la rodilla de delante forme un ángulo recto.

Cuida: poner el pie delantero demasiado cerca del banco. Entonces la rodilla se adelanta y molesta.'),

  ('Sentadilla búlgara en máquina Smith',
   'La misma posición con la barra guiada sobre la espalda, que quita el problema del equilibrio y deja cargar más.

Cuida: colocarte y no poder ajustar después. Da unos pasos de prueba antes de cargar.'),

  ('Sentadilla con banda',
   'Con la banda por debajo de los pies y sobre los hombros, haz la sentadilla. La banda aprieta más cuanto más arriba estás.

Cuida: dejar que la banda te lleve hacia adelante. El peso se reparte en todo el pie.'),

  ('Sentadilla con cinturón',
   'Con el peso colgando de un cinturón en la cadera, baja y sube sin nada apoyado en la espalda.

Cuida: poco. Es justo la versión que quita carga a la columna, y por eso vale la pena conocerla.'),

  ('Sentadilla con landmine',
   'Sujeta el extremo de la barra a la altura del pecho y baja siguiendo su arco, que te ayuda a mantener el tronco erguido.

Cuida: separarte del anclaje. La barra tiene que quedar pegada al pecho.'),

  ('Sentadilla con salto',
   'Baja a media sentadilla y salta con fuerza. Aterriza suave, doblando rodillas y cadera.

Cuida: aterrizar con las piernas rígidas.'),

  ('Sentadilla cosaca',
   'Pies muy abiertos: desplaza el peso a un lado doblando esa rodilla mientras la otra pierna queda estirada con la punta arriba. Cambia de lado.

Cuida: levantar el talón de la pierna que se dobla.'),

  ('Sentadilla de patinador',
   'Sobre una pierna, baja llevando la otra cruzada por detrás hasta rozar el suelo con la rodilla.

Cuida: girar la cadera. El tronco mira al frente.'),

  ('Sentadilla en máquina Smith',
   'Sentadilla con la barra guiada. Adelanta un poco los pies para que la bajada sea cómoda.

Cuida: dejar los pies justo bajo la barra. Con la guía, ahí la rodilla se adelanta sin remedio.'),

  ('Sentadilla frontal',
   'Con la barra apoyada delante, sobre los hombros y sujeta con los codos altos, baja manteniendo el tronco muy vertical.

Cuida: bajar los codos. En cuanto caen, la barra rueda hacia adelante.'),

  ('Sentadilla goblet',
   'Sujeta una kettlebell contra el pecho con las dos manos y baja entre las rodillas manteniéndote erguido.

Cuida: separar la pesa del pecho. Ahí empieza a tirar hacia adelante.'),

  ('Sentadilla goblet con talones elevados',
   'Igual, con los talones sobre unos discos o una cuña. La elevación deja bajar más y carga más el cuádriceps.

Cuida: usar una elevación inestable.'),

  ('Sentadilla hack',
   'Con la espalda apoyada en la máquina y los pies adelantados, baja hasta el ángulo recto y empuja.

Cuida: despegar la espalda baja del respaldo al bajar del todo.'),

  ('Sentadilla isométrica en pared',
   'Espalda pegada a la pared y rodillas en ángulo recto: aguanta la posición el tiempo marcado.

Cuida: apoyar las manos en los muslos. Los brazos van sueltos.'),

  ('Sentadilla shrimp',
   'Sobre una pierna, sujeta el pie de atrás con la mano del mismo lado y baja hasta que la rodilla toque el suelo.

Cuida: intentarla antes de dominar la sentadilla a una pierna.'),

  ('Sentadilla sin peso',
   'Pies a la anchura de los hombros: baja echando la cadera atrás, con los brazos al frente para equilibrar, y sube.

Cuida: quedarte a medio recorrido. Sin peso, la profundidad es lo que trabaja.'),

  ('Sentadilla sissy',
   'De pie y sujeto con una mano, baja llevando las rodillas al frente y el tronco atrás, en línea con los muslos.

Cuida: hacerla con carga o con prisa. La rodilla trabaja aquí en una posición exigente.'),

  ('Subida al cajón con mancuernas',
   'Con una mancuerna en cada mano, sube al cajón apoyando todo el pie y empujando sólo con esa pierna. Baja controlando.

Cuida: darte impulso con el pie que queda en el suelo. Es lo que hace que deje de costar.'),

  ('Zancada estática con mancuernas',
   'En posición de paso, baja la rodilla de atrás hacia el suelo y sube, sin mover los pies entre repeticiones.

Cuida: dar un paso demasiado corto. Entonces la rodilla de delante se adelanta mucho.'),

  ('Zancada estática con pie delantero elevado',
   'La misma zancada con el pie de delante sobre un disco o un escalón, lo que aumenta el recorrido.

Cuida: perder el equilibrio hacia dentro. La rodilla se mantiene en línea con el pie.'),

  ('Zancada estática en máquina Smith',
   'Zancada en el sitio con la barra guiada sobre la espalda. Coloca los pies y no los muevas.

Cuida: dejar el pie delantero mal colocado. Con la guía no puedes corregir a media serie.'),

  ('Zancada hacia adelante',
   'Da un paso al frente y baja la rodilla de atrás hacia el suelo. Empuja con el pie de delante para volver.

Cuida: dejar caer de golpe la rodilla de atrás.'),

  ('Zancada hacia atrás con mancuernas',
   'Da un paso atrás y baja esa rodilla hacia el suelo. Vuelve empujando con la pierna de delante.

Cuida: encoger los hombros por el peso. Los brazos van colgando.'),

  ('Zancada hacia atrás en máquina Smith',
   'Paso atrás con la barra guiada sobre la espalda. La guía deja concentrarse en la pierna sin pelear el equilibrio.

Cuida: colocarte demasiado adelante. La barra baja recta y el cuerpo tiene que estar debajo.'),

  ('Zancada lateral',
   'Da un paso amplio a un lado, dobla esa rodilla echando la cadera atrás y deja la otra pierna estirada. Vuelve al centro.

Cuida: girar la punta del pie. Los dos miran al frente.'),

  ('Zancada lateral con mancuernas',
   'La misma zancada lateral con una mancuerna en cada mano, que bajan por delante de la pierna que trabaja.

Cuida: redondear la espalda al bajar el peso.'),

  ('Zancadas',
   'Alterna pasos al frente bajando la rodilla de atrás hacia el suelo, con una mancuerna en cada mano y el tronco erguido.

Cuida: dar pasos cortos. Con el paso corto la rodilla se adelanta y la cadera no llega a trabajar.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
