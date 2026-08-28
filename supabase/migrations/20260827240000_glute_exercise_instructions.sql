-- Instrucciones escritas de los ejercicios de glúteos.
--
-- Quinta tanda (38; van 218 de 306). El formato y el porqué de las tres
-- condiciones del `where` están en `20260827200000_chest_exercise_instructions.sql`.
--
-- Aquí casi todo el catálogo son parejas del mismo movimiento con distinto
-- material —el puente de glúteos aparece cinco veces, la patada cuatro—, así que
-- el texto dice qué aporta cada versión en vez de repetir la anterior.

update exercises as e
set instructions = v.texto,
    updated_at = now()
from (values
  ('Abducción de cadera de pie con banda',
   'De pie con la banda por encima de las rodillas o en los tobillos, separa una pierna hacia el lado sin inclinar el tronco. Vuelve controlando.

Cuida: irte de lado con todo el cuerpo. El tronco se queda vertical.'),

  ('Abducción de cadera sentado con banda',
   'Sentado con la banda por encima de las rodillas, ábrelas contra la banda y vuelve despacio.

Cuida: soltar de golpe al cerrar. La vuelta cuenta tanto como la apertura.'),

  ('Abducción de cadera tumbado de lado',
   'Tumbado de lado con las piernas estiradas y alineadas con el tronco, sube la de arriba y bájala sin apoyarla.

Cuida: llevar la pierna hacia adelante. Si se adelanta, el trabajo se va al flexor.'),

  ('Abducción en cuadrupedia',
   'A cuatro apoyos, abre una pierna hacia el lado manteniendo la rodilla doblada, sin girar la cadera.

Cuida: dejarte caer hacia el lado contrario para llegar más alto.'),

  ('Abducción en cuadrupedia con banda',
   'La misma apertura con una banda por encima de las rodillas, que añade resistencia desde el primer centímetro.

Cuida: perder la línea de la espalda al empujar contra la banda.'),

  ('Abductores en máquina',
   'Sentado con los muslos por fuera de las almohadillas, abre las piernas y vuelve despacio.

Cuida: echar el tronco atrás para empujar más. La espalda se queda apoyada.'),

  ('Abductores en polea de pie',
   'De pie y de lado a la polea baja, con la tobillera en la pierna de fuera, sepárala del cuerpo y vuelve controlando.

Cuida: inclinarte hacia el lado contrario para ganar recorrido.'),

  ('Almeja',
   'Tumbado de lado con las rodillas dobladas y los pies juntos, abre la rodilla de arriba sin mover la cadera.

Cuida: rodar hacia atrás con la cadera. Los pies siguen juntos y el tronco quieto.'),

  ('Almeja con banda',
   'La misma apertura con una banda por encima de las rodillas.

Cuida: usar una banda tan dura que te obligue a girar la cadera para vencerla.'),

  ('Caminata lateral con banda',
   'Con la banda por encima de las rodillas y media sentadilla, da pasos laterales sin juntar del todo los pies.

Cuida: enderezarte al caminar. La media sentadilla se mantiene todo el recorrido.'),

  ('Caminata monstruo con banda',
   'Con la banda en los tobillos y las rodillas algo flexionadas, camina hacia adelante en diagonal, con los pies bien separados.

Cuida: dar pasos cortos. Lo que trabaja es la apertura en cada paso.'),

  ('Elevación de pierna tumbado de lado',
   'Tumbado de lado, sube la pierna de arriba estirada hasta donde llegue sin mover la cadera y baja despacio.

Cuida: subir más de lo que permite la cadera y acabar girando el tronco.'),

  ('Hip thrust',
   'Con la espalda alta apoyada en un banco y la barra sobre la cadera, sube empujando con los talones hasta quedar en línea de las rodillas a los hombros. Aprieta arriba.

Cuida: arquear la espalda para subir más. Se termina en línea, no curvado.'),

  ('Hip thrust con banda',
   'El mismo movimiento con una banda por encima de las rodillas, que obliga a abrirlas mientras empujas.

Cuida: dejar que las rodillas se metan hacia adentro cuando cansa.'),

  ('Hip thrust con mancuerna',
   'El hip thrust con una mancuerna apoyada en la cadera. Es la versión para hacerlo sin barra ni discos.

Cuida: colocar la mancuerna sobre el hueso. Una toalla doblada debajo lo arregla.'),

  ('Hip thrust en máquina Smith',
   'El hip thrust con la barra guiada, que ahorra tener que equilibrarla y deja cargar más.

Cuida: colocarte mal bajo la barra. La guía baja recta y no se puede corregir a media serie.'),

  ('Hiperextensión enfocada en glúteo',
   'En el banco de hiperextensiones, redondea un poco la espalda alta y sube empujando con el glúteo en vez de con la espalda baja.

Cuida: convertirlo en una hiperextensión normal. Aquí el que manda es el glúteo.'),

  ('Hiperextensión inversa',
   'Con el tronco apoyado y las piernas colgando, súbelas hasta la línea del cuerpo apretando el glúteo y bájalas despacio.

Cuida: coger impulso balanceando las piernas.'),

  ('Marcha en puente de glúteos',
   'En puente de glúteos, levanta un pie unos centímetros y alterna, sin que la cadera baje ni se incline.

Cuida: que la cadera se caiga hacia el lado del pie que levantas.'),

  ('Patada de glúteo atrás con banda',
   'De pie y sujeto a un apoyo, con la banda en el tobillo, lleva la pierna atrás estirada apretando el glúteo.

Cuida: arquear la espalda para llegar más lejos.'),

  ('Patada de glúteo con banda',
   'A cuatro apoyos con la banda en el pie, empuja la pierna hacia atrás y arriba con la rodilla doblada.

Cuida: girar la cadera al empujar. Las dos caderas miran al suelo.'),

  ('Patada de glúteo en cuadrupedia',
   'A cuatro apoyos, sube una pierna con la rodilla doblada como si empujaras el techo con el pie.

Cuida: subir con la espalda baja. Si se arquea, sube menos.'),

  ('Patada de glúteo en máquina',
   'De pie en la máquina con el pie en la plataforma, empuja hacia atrás hasta estirar la cadera.

Cuida: separar el tronco del apoyo del pecho.'),

  ('Patada de glúteo en polea',
   'De frente a la polea baja con la tobillera puesta, lleva la pierna atrás estirada y vuelve controlando.

Cuida: dejar que el peso tire de ti al volver.'),

  ('Peso muerto a una pierna',
   'Sobre una pierna, con la mancuerna en la mano contraria, baja el tronco echando la cadera atrás mientras la otra pierna sube hasta quedar en línea.

Cuida: girar la cadera hacia afuera. La cadera de la pierna que sube mira al suelo.'),

  ('Puente de glúteos',
   'Boca arriba con las rodillas dobladas y los pies apoyados, sube la cadera empujando con los talones hasta quedar en línea. Aprieta arriba.

Cuida: subir con la espalda baja en vez de con el glúteo. Mete la cadera antes de empujar.'),

  ('Puente de glúteos a una pierna',
   'El mismo puente apoyando un solo pie, con la otra pierna estirada o con la rodilla al pecho.

Cuida: que la cadera se incline hacia el lado libre.'),

  ('Puente de glúteos con banda',
   'El puente con una banda por encima de las rodillas, empujándolas hacia afuera mientras subes.

Cuida: dejar que las rodillas se cierren en las últimas repeticiones.'),

  ('Puente de glúteos con barra',
   'El puente desde el suelo con una barra sobre la cadera. Recorrido más corto que el hip thrust, y sin necesidad de banco.

Cuida: apoyar la barra sin protección. Una almohadilla o una toalla, siempre.'),

  ('Puente de glúteos con mancuerna',
   'El puente desde el suelo con una mancuerna sujeta sobre la cadera con las dos manos.

Cuida: soltar la mancuerna al bajar. Se sujeta durante toda la serie.'),

  ('Puente de rana',
   'Boca arriba con las plantas de los pies juntas y las rodillas abiertas hacia los lados, sube la cadera apretando el glúteo.

Cuida: separar los pies al subir. Se quedan juntos y pegados.'),

  ('Puente de rana con banda',
   'El puente de rana con una banda por encima de las rodillas, que suma resistencia a la apertura.

Cuida: dejar que la banda cierre las rodillas.'),

  ('Pull through en polea',
   'De espaldas a la polea baja, con la cuerda entre las piernas, echa la cadera atrás y vuelve estirándola con fuerza.

Cuida: tirar con los brazos. Los brazos son una cuerda; el que trabaja es el glúteo.'),

  ('Rotación de cadera a una pierna',
   'De pie sobre una pierna, con la otra doblada delante, gira la cadera hacia dentro y hacia fuera manteniendo el equilibrio.

Cuida: girar el tronco. El que gira es la cadera de la pierna que apoya.'),

  ('Sentadilla sumo con mancuerna',
   'Pies muy abiertos y puntas hacia afuera, con la mancuerna sujeta entre las piernas. Baja manteniendo el tronco vertical y sube apretando el glúteo.

Cuida: juntar las rodillas al subir.'),

  ('Zancada cruzada',
   'Da un paso atrás cruzando la pierna por detrás de la otra y baja. Vuelve al centro.

Cuida: perder el equilibrio girando el tronco. Los hombros se quedan al frente.'),

  ('Zancada cruzada con mancuernas',
   'La misma zancada cruzada con una mancuerna en cada mano.

Cuida: coger peso antes de tener el equilibrio. Es una zancada con giro y pide práctica.'),

  ('Zancada hacia atrás con déficit',
   'Con el pie de delante sobre un disco o escalón, da un paso atrás y baja más de lo normal.

Cuida: buscar demasiada altura al principio. Un par de centímetros ya cambian el ejercicio.')
) as v(nombre, texto)
where e.name = v.nombre
  and e.user_id is null
  and e.instructions is null;
