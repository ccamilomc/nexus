import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import { profileService } from '../services/profile.service'
import type { Profile, ProfileChanges } from '../types/profile.types'

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string | undefined) => [...profileKeys.all, userId] as const,
}

function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')

  return userId
}

/** El perfil del usuario, o `null` si aun no tiene fila. */
export function useProfile() {
  const { user } = useAuth()

  return useQuery<Profile | null, AppError>({
    queryKey: profileKeys.detail(user?.id),
    queryFn: () => profileService.get(requireUserId(user?.id)),
    enabled: Boolean(user?.id),
  })
}

function useRefreshProfile() {
  const client = useQueryClient()

  return useCallback(() => {
    void client.invalidateQueries({ queryKey: profileKeys.all })
  }, [client])
}

/** Guarda los cambios del perfil que se le pasen. */
export function useSaveProfile() {
  const { user } = useAuth()
  const refresh = useRefreshProfile()

  return useMutation<void, AppError, ProfileChanges>({
    mutationFn: (changes) => profileService.save(requireUserId(user?.id), changes),
    onSuccess: refresh,
  })
}
