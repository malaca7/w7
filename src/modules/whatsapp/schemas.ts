import { z } from "zod";

export const connectionSchema = z.object({
  name: z.string().min(2, "Informe um nome para a conexão").max(50),
  mode: z.enum(["qr_device", "meta_api"]),
  phoneNumber: z.string().min(8, "Número inválido"),
  autoReconnect: z.boolean().default(true),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1, "Mensagem vazia").max(5000),
  type: z.enum([
    "text",
    "audio",
    "image",
    "video",
    "document",
    "pdf",
    "location",
    "contact",
  ]),
  quotedMessageId: z.string().optional(),
});

export const noteSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(3, "A nota precisa ter ao menos 3 caracteres").max(2000),
});

export const transferSchema = z.object({
  conversationId: z.string(),
  toAgentId: z.string().optional(),
  toQueueId: z.string().optional(),
  toDepartmentId: z.string().optional(),
});

export const scheduleMessageSchema = z.object({
  contactId: z.string().optional(),
  conversationId: z.string().optional(),
  body: z.string().min(1).max(2000),
  type: z.enum(["once", "recurring"]),
  scheduleAt: z.string().min(1),
  recurrenceRule: z.string().optional(),
});

export type ConnectionForm = z.infer<typeof connectionSchema>;
export type SendMessageForm = z.infer<typeof sendMessageSchema>;
export type NoteForm = z.infer<typeof noteSchema>;
export type TransferForm = z.infer<typeof transferSchema>;
export type ScheduleMessageForm = z.infer<typeof scheduleMessageSchema>;
