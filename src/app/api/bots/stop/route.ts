import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { BotController } from '@/lib/trading/bot/bot_controller';
import { log } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await req.json();

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Récupérer l'utilisateur depuis Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier que le bot appartient à l'utilisateur
    const bot = await prisma.bot.findFirst({
      where: {
        id: botId,
        userId: user.id
      }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Arrêter le bot via le BotController
    const botController = BotController.getInstance();
    try {
      await botController.stopBot(botId);
    } catch (error) {
      // Le bot n'était peut-être pas démarré dans le controller, c'est OK
      log.warn('[Bot API] Bot was not running in controller', { botId });
    }

    // Mettre à jour le statut dans la base de données
    await prisma.bot.update({
      where: { id: botId },
      data: { 
        status: 'INACTIVE',
        updatedAt: new Date()
      }
    });

    log.info('[Bot API] Bot stopped successfully', {
      userId,
      botId,
      botName: bot.name
    });

    return NextResponse.json({
      success: true,
      message: 'Bot stopped successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        strategy: bot.strategy,
        status: 'stopped'
      }
    });

  } catch (error) {
    log.error('[Bot API] Failed to stop bot', { error });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('not running') ? 404 : 500;

    return NextResponse.json({
      error: 'Failed to stop bot',
      details: errorMessage
    }, { status });
  }
}