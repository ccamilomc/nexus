import type { Enums } from '@/core/supabase'
// `Constants` (valor en runtime) se importa del módulo generado, no del barrel:
// el barrel arrastra el cliente de Supabase (y su lectura de env), y estos datos
// son puros. Así los tests no necesitan variables de entorno (sin red ni BD).
import { Constants } from '@/core/supabase/database.types'

/** Entrenamientos que muestra el historial. Se ampliará con paginación. */
export const SESSION_HISTORY_LIMIT = 20

export const MUSCLE_GROUP_LABELS: Record<Enums<'muscle_group'>, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Piernas',
  glutes: 'Glúteos',
  core: 'Core',
  full_body: 'Cuerpo completo',
  cardio: 'Cardio',
}

export const EQUIPMENT_LABELS: Record<Enums<'equipment'>, string> = {
  none: 'Sin equipo',
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  cable: 'Polea',
  kettlebell: 'Kettlebell',
  band: 'Banda',
  bodyweight: 'Peso corporal',
  suspension: 'Suspensión (TRX)',
  medicine_ball: 'Balón medicinal',
  plate: 'Disco',
  cardio_machine: 'Máquina de cardio',
}

export interface EnumOption<T extends string> {
  readonly value: T
  readonly label: string
}

/**
 * Opciones para los desplegables del formulario de ejercicio.
 *
 * Se derivan de `Constants` (valores generados desde la base) para que un enum
 * nuevo aparezca en la interfaz sin tocar dos sitios; la etiqueta viene de los
 * mapas de arriba.
 */
export const MUSCLE_GROUP_OPTIONS: readonly EnumOption<Enums<'muscle_group'>>[] =
  Constants.public.Enums.muscle_group.map((value) => ({ value, label: MUSCLE_GROUP_LABELS[value] }))

export const EQUIPMENT_OPTIONS: readonly EnumOption<Enums<'equipment'>>[] =
  Constants.public.Enums.equipment.map((value) => ({ value, label: EQUIPMENT_LABELS[value] }))
