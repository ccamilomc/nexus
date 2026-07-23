import { Sparkles } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Asistente"
        description="Interpreta tus recomendaciones y responde tus dudas."
      />
      <EmptyState
        icon={Sparkles}
        title="El asistente aún no está disponible"
        description="Llega en el Sprint 13. Explicará las recomendaciones del motor, sin sustituirlo nunca."
      />
    </>
  )
}
