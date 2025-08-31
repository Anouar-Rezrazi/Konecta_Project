import { z } from 'zod';

export const CallSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  date: z.date(),
  duration: z.number().min(0, 'Duration must be positive'),
  agentId: z.string().min(1, 'Agent is required'),
  status: z.enum(['completed', 'missed', 'abandoned', 'busy']),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

export const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['agent', 'supervisor']),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type CallType = z.infer<typeof CallSchema>;
export type UserType = z.infer<typeof UserSchema>;
export type LoginType = z.infer<typeof LoginSchema>;
