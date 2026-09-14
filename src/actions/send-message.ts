'use server';

import { z } from 'zod';
import { getDb } from '@/db';
import { contactMessage } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';

const DEDUP_WINDOW_MS = 60 * 1000;

const contactFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'minLength' })
    .max(30, { message: 'maxLengthName' }),
  email: z.string().email({ message: 'invalidEmail' }),
  message: z
    .string()
    .min(10, { message: 'minLengthMessage' })
    .max(2000, { message: 'maxLengthMessage' }),
});

export type SendMessageResult =
  | { success: true }
  | { success: false; error: string };

export async function sendMessageAction(
  formData: FormData
): Promise<SendMessageResult> {
  const name = formData.get('name')?.toString().trim() ?? '';
  const email = formData.get('email')?.toString().trim() ?? '';
  // Normalize line breaks before validation to keep browser/server length checks consistent.
  const message = (formData.get('message')?.toString() ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const parsed = contactFormSchema.safeParse({ name, email, message });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const key =
      first.name?.[0] ?? first.email?.[0] ?? first.message?.[0] ?? 'invalid';
    return { success: false, error: key };
  }

  try {
    const db = await getDb();
    const dedupWindowStart = new Date(Date.now() - DEDUP_WINDOW_MS);
    const duplicated = await db
      .select({ id: contactMessage.id })
      .from(contactMessage)
      .where(
        and(
          eq(contactMessage.email, parsed.data.email),
          eq(contactMessage.message, parsed.data.message),
          gte(contactMessage.createdAt, dedupWindowStart)
        )
      )
      .limit(1);

    // Same payload submitted recently; treat as successful to avoid duplicate rows.
    if (duplicated.length > 0) {
      return { success: true };
    }

    await db.insert(contactMessage).values({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save contact message:', error);
    return { success: false, error: 'invalid' };
  }
}
