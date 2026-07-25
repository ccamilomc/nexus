import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/app/layout/AppShell'
import { MorePage } from '@/app/pages/MorePage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { RedirectIfAuth, RequireAuth } from '@/app/router/guards'
import { ROUTES, WORKOUT_ROUTINE_DETAIL_PATTERN } from '@/app/router/routes'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '@/features/auth'

// Las pantallas de auth van eager (son la entrada). Los módulos, perezosos.
const DashboardPage = lazy(async () => ({
  default: (await import('@/features/dashboard')).DashboardPage,
}))
const PlanningPage = lazy(async () => ({
  default: (await import('@/features/planning')).PlanningPage,
}))
const WorkoutLayout = lazy(async () => ({
  default: (await import('@/features/workout')).WorkoutLayout,
}))
const TrainPage = lazy(async () => ({
  default: (await import('@/features/workout')).TrainPage,
}))
const WorkoutHistoryPage = lazy(async () => ({
  default: (await import('@/features/workout')).WorkoutHistoryPage,
}))
const ExercisesPage = lazy(async () => ({
  default: (await import('@/features/workout')).ExercisesPage,
}))
const RoutinesPage = lazy(async () => ({
  default: (await import('@/features/workout')).RoutinesPage,
}))
const RoutineDetailPage = lazy(async () => ({
  default: (await import('@/features/workout')).RoutineDetailPage,
}))
const NutritionLayout = lazy(async () => ({
  default: (await import('@/features/nutrition')).NutritionLayout,
}))
const TodayPage = lazy(async () => ({
  default: (await import('@/features/nutrition')).TodayPage,
}))
const FoodsPage = lazy(async () => ({
  default: (await import('@/features/nutrition')).FoodsPage,
}))
const HabitsPage = lazy(async () => ({
  default: (await import('@/features/habits')).HabitsPage,
}))
const StudyPage = lazy(async () => ({
  default: (await import('@/features/study')).StudyPage,
}))
const SleepPage = lazy(async () => ({
  default: (await import('@/features/sleep')).SleepPage,
}))
const HealthPage = lazy(async () => ({
  default: (await import('@/features/health')).HealthPage,
}))
const AnalyticsPage = lazy(async () => ({
  default: (await import('@/features/analytics')).AnalyticsPage,
}))
const AssistantPage = lazy(async () => ({
  default: (await import('@/features/assistant')).AssistantPage,
}))
const SettingsPage = lazy(async () => ({
  default: (await import('@/features/settings')).SettingsPage,
}))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas: sólo accesibles sin sesión */}
        <Route element={<RedirectIfAuth />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        </Route>

        {/* Recuperación: se abre desde el enlace del correo */}
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />

        {/* Protegidas: requieren sesión */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.planning} element={<PlanningPage />} />
            <Route path={ROUTES.workout} element={<WorkoutLayout />}>
              <Route index element={<TrainPage />} />
              <Route path={ROUTES.workoutRoutines} element={<RoutinesPage />} />
              <Route path={WORKOUT_ROUTINE_DETAIL_PATTERN} element={<RoutineDetailPage />} />
              <Route path={ROUTES.workoutHistory} element={<WorkoutHistoryPage />} />
              <Route path={ROUTES.workoutExercises} element={<ExercisesPage />} />
            </Route>
            <Route path={ROUTES.nutrition} element={<NutritionLayout />}>
              <Route index element={<TodayPage />} />
              <Route path={ROUTES.nutritionFoods} element={<FoodsPage />} />
            </Route>
            <Route path={ROUTES.habits} element={<HabitsPage />} />
            <Route path={ROUTES.study} element={<StudyPage />} />
            <Route path={ROUTES.sleep} element={<SleepPage />} />
            <Route path={ROUTES.health} element={<HealthPage />} />
            <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
            <Route path={ROUTES.assistant} element={<AssistantPage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route path={ROUTES.more} element={<MorePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
