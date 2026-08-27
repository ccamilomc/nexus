/**
 * Qué ilustración le toca a cada ejercicio del catálogo.
 *
 * Los dibujos vienen de [workout-guide](https://github.com/bryllim/workout-guide),
 * de Bryl Lim sobre obra de Everkinetic, **con licencia CC BY-SA 4.0**: obliga a
 * dar crédito visible, y por eso la pantalla del ejercicio lo lleva escrito.
 *
 * **El emparejamiento va a mano y aquí.** Nuestro catálogo está en español y la
 * biblioteca en inglés, así que no hay forma automática de saber que «Press
 * francés» es `skull-crusher`. Escrito una vez, se lee siempre igual.
 *
 * Un ejercicio sin entrada aquí —los que crea el usuario, y «Thruster», que no
 * existe en la biblioteca— simplemente no enseña dibujo. **La pantalla tiene que
 * verse bien sin él**, que es el caso de cualquiera que se cree a mano.
 */
export const EXERCISE_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  // Pecho
  'Aperturas con mancuernas': 'dumbbell-fly',
  'Cruce de poleas': 'cable-fly',
  Flexiones: 'push-up',
  'Fondos en paralelas': 'chest-dip',
  'Press de banca': 'bench-press',
  'Press de banca con mancuernas': 'dumbbell-bench-press',
  'Press de pecho en máquina': 'machine-chest-press',
  'Press inclinado con barra': 'incline-bench-press',
  'Press inclinado con mancuernas': 'incline-dumbbell-press',

  // Espalda
  Dominadas: 'pull-up',
  'Encogimientos de hombros': 'shrug',
  Hiperextensiones: 'back-extension',
  'Jalón al pecho': 'lat-pulldown',
  'Pull-over en polea': 'straight-arm-pulldown',
  'Remo con barra': 'barbell-row',
  'Remo con mancuerna': 'one-arm-dumbbell-row',
  'Remo en máquina': 'machine-row',
  'Remo en polea baja': 'seated-row',
  'Remo en TRX': 'inverted-row',

  // Hombros
  'Elevación frontal con disco': 'plate-front-raise',
  'Elevaciones frontales': 'front-raise',
  'Elevaciones laterales': 'lateral-raise',
  'Face pull': 'face-pull',
  Pájaros: 'rear-delt-fly',
  'Press de hombro con mancuernas': 'seated-dumbbell-press',
  'Press de hombro en máquina': 'machine-shoulder-press',
  'Press militar': 'overhead-press',

  // Bíceps
  'Curl con barra': 'ez-bar-curl',
  'Curl de bíceps': 'bicep-curl',
  'Curl en polea': 'cable-curl',
  'Curl martillo': 'hammer-curl',
  'Curl predicador': 'preacher-curl',

  // Tríceps
  'Extensión de tríceps': 'tricep-pushdown',
  'Extensión sobre la cabeza': 'overhead-tricep-extension',
  'Fondos en banco': 'bench-dip',
  'Patada de tríceps': 'tricep-kickback',
  'Press francés': 'skull-crusher',

  // Piernas
  'Curl femoral': 'leg-curl',
  'Elevación de gemelos': 'standing-calf-raise',
  'Extensión de cuádriceps': 'leg-extension',
  'Peso muerto': 'deadlift',
  'Peso muerto rumano': 'romanian-deadlift',
  'Prensa de piernas': 'leg-press',
  Sentadilla: 'squat',
  'Sentadilla búlgara': 'bulgarian-split-squat',
  'Sentadilla frontal': 'front-squat',
  'Sentadilla goblet': 'goblet-squat',
  Zancadas: 'walking-lunge',

  // Glúteos
  'Abductores en máquina': 'hip-abduction-machine',
  'Hip thrust': 'hip-thrust',
  'Patada de glúteo en polea': 'cable-kickback',
  'Peso muerto a una pierna': 'single-leg-romanian-deadlift',
  'Puente de glúteos': 'glute-bridge',

  // Core
  Abdominales: 'crunch',
  'Crunch en polea': 'cable-crunch',
  'Elevación de piernas colgado': 'hanging-leg-raise',
  'Giro ruso': 'russian-twist',
  Plancha: 'plank',
  'Plancha lateral': 'side-plank',
  'Rueda abdominal': 'ab-wheel',

  // Cuerpo completo y cardio
  Burpees: 'burpee',
  'Remo con banda': 'banded-row',
  'Swing con kettlebell': 'kettlebell-swing',
  'Bicicleta estática': 'cycling',
  Caminadora: 'treadmill-incline-walk',
  'Carrera continua': 'running',
  Elíptica: 'elliptical',
  'Remo ergómetro': 'rowing',
  'Saltar la cuerda': 'jump-rope',
}
