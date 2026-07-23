import { z } from 'zod'

const email = z.email('Ingresa un correo válido.')
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  displayName: z.string().trim().max(60, 'Máximo 60 caracteres.').optional(),
  email,
  password,
})
export type RegisterValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({ email })
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden.',
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
