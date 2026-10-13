import { Request } from 'express';
import { prisma } from '../../prisma';

export async function logAuditEvent(params: {
  userId?: string | null;
  event: string;
  req?: Request;
  metadata?: Record<string, any>;
}) {
  try {
    const ipAddress = params.req
      ? (params.req.headers['x-forwarded-for'] as string) || params.req.socket.remoteAddress || null
      : null;
    const userAgent = params.req ? (params.req.headers['user-agent'] as string) || null : null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        event: params.event,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : null,
        userAgent,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error('[AuditLog Error]: Failed to write audit event', err);
  }
}
