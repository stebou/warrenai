// src/lib/db/index.ts
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable.');
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn'] : ['warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}