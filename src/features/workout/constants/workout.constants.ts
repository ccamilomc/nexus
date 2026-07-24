import type { Enums } from '@/core/supabase'

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
}
