import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useToday } from '@/core/time'
import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { DayStudyCard } from '../components/DayStudyCard'
import { StudyLogForm } from '../components/StudyLogForm'
import { StudySessionList } from '../components/StudySessionList'
import { StudyTimerCard } from '../components/StudyTimerCard'
import { WeekStudyCard } from '../components/WeekStudyCard'
import { useActiveStudySession, useDayStudy, useSubjects, useWeekStudy } from '../hooks/use-study'

/** Lo estudiado hoy, el cronómetro y el registro de nuevas sesiones. */
export function TodayStudyPage() {
  const today = useToday()
  const subjects = useSubjects()
  const day = useDayStudy(today)
  const week = useWeekStudy(today)
  const active = useActiveStudySession()

  if (subjects.isPending || day.isPending) {
    return <SkeletonList label="Cargando lo de hoy" rows={3} rowClassName="h-24" />
  }

  if (subjects.isError) {
    return <LoadFailure message={subjects.error.message} onRetry={() => void subjects.refetch()} />
  }

  if (day.isError) {
    return <LoadFailure message={day.error.message} onRetry={() => void day.refetch()} />
  }

  // Sin materias no hay nada que registrar: se guía al primer paso en vez de
  // mostrar un formulario que no se puede completar.
  if (subjects.data.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Empieza por tus materias"
        description="Crea una materia y podrás registrar cuánto estudias en cada una."
        action={
          <Button asChild>
            <Link to={ROUTES.studySubjects}>Crear materia</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <DayStudyCard day={day.data} isPending={false} />
      <WeekStudyCard week={week.data ?? null} isPending={week.isPending} today={today} />
      <StudyTimerCard subjects={subjects.data} active={active.data ?? null} />
      <StudyLogForm subjects={subjects.data} />
      <StudySessionList sessions={day.data?.sessions ?? []} />
    </div>
  )
}
