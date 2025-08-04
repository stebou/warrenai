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

    // Récupérer le bot depuis la base de données
    const bot = await prisma.bot.findFirst({
      where: {
        id: botId,
        userId: user.id
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

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Démarrer le bot via le BotController
    const botController = BotController.getInstance();
    
    // Vérifier si le bot est déjà en cours d'exécution
    const existingInstance = botController.getBotInstance(bot.id);
    if (existingInstance) {
      log.info('[Bot API] Bot already running, updating status', {
        botId: bot.id,
        botName: bot.name
      });
      
      // Le bot est déjà actif, juste s'assurer que le statut DB est correct
      await prisma.bot.update({
        where: { id: bot.id },
        data: { 
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Bot is already running',
        bot: {
          id: bot.id,
          name: bot.name,
          strategy: bot.strategy,
          status: 'running'
        }
      });
    }
    
    await botController.startBot(bot);

    // Mettre à jour le statut dans la base de données
    await prisma.bot.update({
      where: { id: botId },
      data: { 
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    log.info('[Bot API] Bot started successfully', {
      userId,
      botId,
      botName: bot.name
    });

    return NextResponse.json({
      success: true,
      message: 'Bot started successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        strategy: bot.strategy,
        status: 'running'
      }
    });

  } catch (error) {
    log.error('[Bot API] Failed to start bot', { error });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('already running') ? 409 : 500;

    return NextResponse.json({
      error: 'Failed to start bot',
      details: errorMessage
    }, { status });
  }
}