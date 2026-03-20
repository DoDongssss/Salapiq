import { z } from "zod"

export const loginSchema = z.object({
  email:    z.string().min(1, "required").email("invalid email"),
  password: z.string().min(1, "required").min(6, "min 6 chars"),
})

export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name:       z.string().min(1, "required").min(2, "at least 2 characters"),
    email:           z.string().min(1, "required").email("invalid email"),
    password:        z.string().min(1, "required").min(6, "min 6 chars"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "passwords don't match",
    path: ["confirmPassword"],
  })

export type RegisterForm = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "required").email("invalid email"),
})

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password:        z.string().min(6, "min 6 chars"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "passwords don't match",
    path: ["confirmPassword"],
  })

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>