import { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logActivity(userId: string, type: ActivityType, message: string) {
  await prisma.activityLog.create({
    data: { userId, type, message }
  });
}

export async function logError(message: string, route?: string, userId?: string) {
  await prisma.errorLog.create({
    data: {
      message,
      route,
      userId
    }
  });
}
