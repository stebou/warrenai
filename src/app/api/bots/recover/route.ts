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

    // Récupérer l'utilisateur depuis Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Récupérer tous les bots marqués comme ACTIVE dans la DB
    const activeBots = await prisma.bot.findMany({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
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
        userId: true  // AJOUTÉ: nécessaire pour ExchangeFactory.createForUser
      }
    });

    const botController = BotController.getInstance();
    let recovered = 0;
    let errors = 0;

    // Redémarrer chaque bot qui n'est pas déjà dans le controller
    for (const bot of activeBots) {
      try {
        const botInstance = botController.getBotInstance(bot.id);
        
        if (!botInstance) {
          // Ce bot est marqué ACTIVE mais n'est pas dans le controller, le redémarrer
          await botController.startBot(bot);
          recovered++;
          
          log.info('[Bot Recovery] Bot recovered', {
            botId: bot.id,
            botName: bot.name
          });
        } else {
          log.debug('[Bot Recovery] Bot already running', {
            botId: bot.id,
            botName: bot.name
          });
        }
      } catch (error) {
        errors++;
        log.error('[Bot Recovery] Failed to recover bot', {
          botId: bot.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    log.info('[Bot Recovery] Recovery completed', {
      userId,
      totalActive: activeBots.length,
      recovered,
      errors
    });

    return NextResponse.json({
      success: true,
      message: `Récupération terminée: ${recovered} bots redémarrés`,
      recovered,
      total: activeBots.length,
      errors
    });

  } catch (error) {
    log.error('[Bot Recovery] Recovery failed', { error });
    return NextResponse.json({
      error: 'Failed to recover bots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}