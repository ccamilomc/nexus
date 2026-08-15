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

  /** Las materias retiradas, de la última en retirarse a la primera. */
  async listRetiredSubjects(userId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /** Cuántas sesiones tiene una materia. Sólo cuenta: no baja las filas. */
  async countSessions(subjectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('study_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subjectId)
      .is('deleted_at', null)

    if (error) throw error
    return count ?? 0
  },

  /**
   * Borra una materia de verdad.
   *
   * **Sólo para las que no tienen ninguna sesión.** La clave ajena de
   * `study_sessions` es `on delete set null`, así que la base no se negaría:
   * dejaría las sesiones sin materia, y la pantalla espera que la tengan.
   */
  async deleteSubjectForever(subjectId: string): Promise<void> {
    const { error } = await supabase.from('subjects').delete().eq('id', subjectId)

    if (error) throw error
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

  /**
   * Sesiones **terminadas** dentro de un rango, por su inicio.
   *
   * La que está en curso se pide aparte: mientras corre no tiene duración que
   * sumar, y aparecería en la lista del día como una sesión de cero minutos.
   */
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
      .not('ended_at', 'is', null)
      .gte('started_at', fromIso)
      .lt('started_at', toIso)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /** La sesión que sigue corriendo, si la hay: la que no tiene fin. */
  async findActiveSession(userId: string): Promise<StudySessionWithSubject | null> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(SESSION_WITH_SUBJECT)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async updateSession(
    sessionId: string,
    patch: TablesUpdate<'study_sessions'>,
  ): Promise<StudySession> {
    const { data, error } = await supabase
      .from('study_sessions')
      .update(patch)
      .eq('id', sessionId)
      .select('*')
      .single()

    if (error) throw error
    return data
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
