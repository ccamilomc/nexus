import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/app/layout/AppShell'
import { MorePage } from '@/app/pages/MorePage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { RedirectIfAuth, RequireAuth, RequireOnboarding } from '@/app/router/guards'
import { ROUTES, WORKOUT_ROUTINE_DETAIL_PATTERN } from '@/app/router/routes'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '@/features/auth'

// Las pantallas de auth van eager (son la entrada). Los módulos, perezosos.
const TodayPage = lazy(async () => ({
  default: (await import('@/features/today')).TodayPage,
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
const NutritionTodayPage = lazy(async () => ({
  default: (await import('@/features/nutrition')).TodayPage,
}))
const FoodsPage = lazy(async () => ({
  default: (await import('@/features/nutrition')).FoodsPage,
}))
const GoalsPage = lazy(async () => ({
  default: (await import('@/features/nutrition')).GoalsPage,
}))
const HabitsPage = lazy(async () => ({
  default: (await import('@/features/habits')).HabitsPage,
}))
const StudyLayout = lazy(async () => ({
  default: (await import('@/features/study')).StudyLayout,
}))
const TodayStudyPage = lazy(async () => ({
  default: (await import('@/features/study')).TodayStudyPage,
}))
const SubjectsPage = lazy(async () => ({
  default: (await import('@/features/study')).SubjectsPage,
}))
const SleepPage = lazy(async () => ({
  default: (await import('@/features/sleep')).SleepPage,
}))
const HealthPage = lazy(async () => ({
  default: (await import('@/features/health')).HealthPage,
}))
const FinancePage = lazy(async () => ({
  default: (await import('@/features/finance')).FinancePage,
}))
const FinanceRecurringPage = lazy(async () => ({
  default: (await import('@/features/finance')).RecurringPage,
}))
const FinanceDebtsPage = lazy(async () => ({
  default: (await import('@/features/finance')).DebtsPage,
}))
const FinanceAccountsPage = lazy(async () => ({
  default: (await import('@/features/finance')).AccountsPage,
}))
const FinanceCategoriesPage = lazy(async () => ({
  default: (await import('@/features/finance')).CategoriesPage,
}))
const DashboardPage = lazy(async () => ({
  default: (await import('@/features/dashboard')).DashboardPage,
}))
const SettingsPage = lazy(async () => ({
  default: (await import('@/features/settings')).SettingsPage,
}))
// La bienvenida se ve una vez en la vida: no tiene por qué viajar en el trozo
// que se descarga al entrar.
const OnboardingPage = lazy(async () => ({
  default: (await import('@/features/onboarding')).OnboardingPage,
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
          {/* La bienvenida va sin cascaron: sin barra ni menu, como las de acceso. */}
          <Route path={ROUTES.onboarding} element={<OnboardingPage />} />

          <Route element={<RequireOnboarding />}>
            <Route element={<AppShell />}>
              <Route path={ROUTES.today} element={<TodayPage />} />
              <Route path={ROUTES.planning} element={<PlanningPage />} />
              <Route path={ROUTES.workout} element={<WorkoutLayout />}>
                <Route index element={<TrainPage />} />
                <Route path={ROUTES.workoutRoutines} element={<RoutinesPage />} />
                <Route path={WORKOUT_ROUTINE_DETAIL_PATTERN} element={<RoutineDetailPage />} />
                <Route path={ROUTES.workoutHistory} element={<WorkoutHistoryPage />} />
                <Route path={ROUTES.workoutExercises} element={<ExercisesPage />} />
              </Route>
              <Route path={ROUTES.nutrition} element={<NutritionLayout />}>
                <Route index element={<NutritionTodayPage />} />
                <Route path={ROUTES.nutritionFoods} element={<FoodsPage />} />
                <Route path={ROUTES.nutritionGoals} element={<GoalsPage />} />
              </Route>
              <Route path={ROUTES.habits} element={<HabitsPage />} />
              <Route path={ROUTES.study} element={<StudyLayout />}>
                <Route index element={<TodayStudyPage />} />
                <Route path={ROUTES.studySubjects} element={<SubjectsPage />} />
              </Route>
              <Route path={ROUTES.sleep} element={<SleepPage />} />
              <Route path={ROUTES.health} element={<HealthPage />} />
              <Route path={ROUTES.finance} element={<FinancePage />} />
              <Route path={ROUTES.financeRecurring} element={<FinanceRecurringPage />} />
              <Route path={ROUTES.financeDebts} element={<FinanceDebtsPage />} />
              <Route path={ROUTES.financeAccounts} element={<FinanceAccountsPage />} />
              <Route path={ROUTES.financeCategories} element={<FinanceCategoriesPage />} />
              <Route path={ROUTES.dashboard} element={<DashboardPage />} />
              <Route path={ROUTES.settings} element={<SettingsPage />} />
              <Route path={ROUTES.more} element={<MorePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
