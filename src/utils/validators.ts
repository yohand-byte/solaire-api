import { z } from 'zod';
export const ProjectSchema = z.object({ clientId: z.string().min(1), installerId: z.string().min(1), title: z.string().min(1).max(200), address: z.string().min(5), powerOutput: z.number().positive() });
export const InvoiceSchema = z.object({ projectId: z.string().min(1), total: z.number().positive(), items: z.array(z.object({ description: z.string(), amount: z.number() })) });
export const MessageSchema = z.object({ projectId: z.string().min(1), content: z.string().min(1).max(5000) });
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
export type MessageInput = z.infer<typeof MessageSchema>;
