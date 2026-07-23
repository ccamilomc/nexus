import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/app/layout/AppShell'
import { MorePage } from '@/app/pages/MorePage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { ROUTES } from '@/app/router/routes'

// Cada módulo se carga bajo demanda desde el barrel público de su feature.
const DashboardPage = lazy(async () => ({
  default: (await import('@/features/dashboard')).DashboardPage,
}))
const PlanningPage = lazy(async () => ({
  default: (await import('@/features/planning')).PlanningPage,
}))
const WorkoutPage = lazy(async () => ({
  default: (await import('@/features/workout')).WorkoutPage,
}))
const NutritionPage = lazy(async () => ({
  default: (await import('@/features/nutrition')).NutritionPage,
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
        <Route element={<AppShell />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.planning} element={<PlanningPage />} />
          <Route path={ROUTES.workout} element={<WorkoutPage />} />
          <Route path={ROUTES.nutrition} element={<NutritionPage />} />
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
      </Routes>
    </BrowserRouter>
  )
}
