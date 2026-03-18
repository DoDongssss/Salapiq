import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "required")
    .email("invalid email"),
  password: z
    .string()
    .min(1, "required")
    .min(6, "min 6 chars"),
})

export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "required")
      .min(2, "at least 2 characters"),
    email: z
      .string()
      .min(1, "required")
      .email("invalid email"),
    password: z
      .string()
      .min(1, "required")
      .min(6, "min 6 chars"),
    confirmPassword: z
      .string()
      .min(1, "required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords don't match",
    path: ["confirmPassword"],
  })

export type RegisterForm = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "required")
    .email("invalid email"),
})

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>