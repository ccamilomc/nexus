import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

/**
 * Pantalla inicial de Nexus (Sprint 1). Su único propósito es verificar que toda
 * la cadena técnica funciona de extremo a extremo: Tailwind + design tokens,
 * shadcn/ui, Framer Motion, Lucide y TypeScript. El shell real (router, layout,
 * navegación) se construye en el Sprint 2.
 */
export function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Nexus</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Tu sistema operativo personal. La base técnica (Fase 1) está lista.
        </p>
        <Button>Comenzar</Button>
      </motion.div>
    </main>
  )
}
