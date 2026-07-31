import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type { StudySession, StudySessionWithSubject, Subject } from '../types/study.types'

/** Datos de la materia que la interfaz necesita junto a cada sesión. */
const SESSION_WITH_SUBJECT = '*, subject:subjects(id, name, color)'

/** Acceso a datos de estudio. Sólo habla con Supabase; sin reglas de negocio. */
export const studyRepository = {
  async listSubjects(userId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertSubject(input: TablesInsert<'subjects'>): Promise<Subject> {
    const { data, error } = await supabase.from('subjects').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateSubject(subjectId: string, patch: TablesUpdate<'subjects'>): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .update(patch)
      .eq('id', subjectId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Sesiones dentro de un rango, por su inicio (el día local, en la práctica). */
  async listSessionsBetween(
    userId: string,
    fromIso: string,
    toIso: string,
  ): Promise<StudySessionWithSubject[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(SESSION_WITH_SUBJECT)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('started_at', fromIso)
      .lt('started_at', toIso)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async insertSession(input: TablesInsert<'study_sessions'>): Promise<StudySession> {
    const { data, error } = await supabase.from('study_sessions').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  /** Borrado lógico: la sesión es sincronizable offline (ver docs/04). */
  async softDeleteSession(sessionId: string, deletedAtIso: string): Promise<void> {
    const { error } = await supabase
      .from('study_sessions')
      .update({ deleted_at: deletedAtIso })
      .eq('id', sessionId)

    if (error) throw error
  },
}
