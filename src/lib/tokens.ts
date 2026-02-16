import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function generateActionToken(
  eventId: string,
  userId: string,
  type: string,
  expiresInHours: number = 72,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.actionToken.create({
    data: {
      token,
      type,
      eventId,
      userId,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    },
  });

  return token;
}
