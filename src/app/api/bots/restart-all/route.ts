import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { BotController } from '@/lib/trading/bot/bot_controller';
import { log } from '@/lib/logger';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer l'utilisateur depuis Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Récupérer tous les bots de l'utilisateur
    const userBots = await prisma.bot.findMany({
      where: { userId: user.id }
    });

    const botController = BotController.getInstance();
    let restarted = 0;

    // Redémarrer chaque bot
    for (const bot of userBots) {
      try {
        // Arrêter s'il tourne déjà
        const botInstance = botController.getBotInstance(bot.id);
        if (botInstance) {
          await botController.stopBot(bot.id);
        }
        
        // Redémarrer avec les nouveaux paramètres
        await botController.startBot(bot);
        restarted++;
        
        log.info('[Restart API] Bot restarted', {
          botId: bot.id,
          botName: bot.name
        });
      } catch (error) {
        log.error('[Restart API] Failed to restart bot', {
          botId: bot.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    log.info('[Restart API] Bots restart completed', {
      userId,
      totalBots: userBots.length,
      restarted
    });

    return NextResponse.json({
      success: true,
      message: `${restarted}/${userBots.length} bots redémarrés avec succès`,
      restarted,
      total: userBots.length
    });

  } catch (error) {
    log.error('[Restart API] Failed to restart bots', { error });
    return NextResponse.json({
      error: 'Failed to restart bots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}