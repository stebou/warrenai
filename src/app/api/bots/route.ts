import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    // 1. Authentification et récupération de l'ID utilisateur
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Récupérer tous les bots de l'utilisateur
    const bots = await prisma.bot.findMany({
      where: {
        user: {
          clerkId: userId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        strategy: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        aiConfig: true,
        promptVersion: true
      }
    });

    log.info('Bots retrieved successfully', { 
      userId, 
      botCount: bots.length 
    });

    return NextResponse.json({ bots }, { status: 200 });

  } catch (error) {
    log.error('Failed to retrieve bots', { error });
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}