import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { BotController } from '@/lib/trading/bot/bot_controller';
import { log } from '@/lib/logger';

export async function DELETE(request: Request) {
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

    // Récupérer le botId depuis les paramètres de requête ou le body
    const url = new URL(request.url);
    const botId = url.searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Vérifier que le bot appartient à l'utilisateur
    const bot = await prisma.bot.findFirst({
      where: { 
        id: botId,
        userId: user.id 
      }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found or access denied' }, { status: 404 });
    }

    // Arrêter le bot s'il est en cours d'exécution
    const botController = BotController.getInstance();
    const botInstance = botController.getBotInstance(botId);
    if (botInstance) {
      try {
        await botController.stopBot(botId);
        log.info('[Delete API] Bot stopped before deletion', { botId, botName: bot.name });
      } catch (error) {
        log.warn('[Delete API] Failed to stop bot before deletion', { 
          botId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Supprimer les statistiques du bot
    await prisma.botStats.deleteMany({
      where: { botId }
    });

    // Supprimer le bot
    await prisma.bot.delete({
      where: { id: botId }
    });

    log.info('[Delete API] Bot deleted successfully', {
      userId,
      botId,
      botName: bot.name
    });

    return NextResponse.json({
      success: true,
      message: 'Bot supprimé avec succès',
      botId
    });

  } catch (error) {
    log.error('[Delete API] Failed to delete bot', { error });
    return NextResponse.json({
      error: 'Failed to delete bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    // Récupérer le botId depuis le body de la requête
    const { botId } = await request.json();

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Vérifier que le bot appartient à l'utilisateur
    const bot = await prisma.bot.findFirst({
      where: { 
        id: botId,
        userId: user.id 
      }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found or access denied' }, { status: 404 });
    }

    // Arrêter le bot s'il est en cours d'exécution
    const botController = BotController.getInstance();
    const botInstance = botController.getBotInstance(botId);
    if (botInstance) {
      try {
        await botController.stopBot(botId);
        log.info('[Delete API] Bot stopped before deletion', { botId, botName: bot.name });
      } catch (error) {
        log.warn('[Delete API] Failed to stop bot before deletion', { 
          botId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Supprimer les statistiques du bot
    await prisma.botStats.deleteMany({
      where: { botId }
    });

    // Supprimer le bot
    await prisma.bot.delete({
      where: { id: botId }
    });

    log.info('[Delete API] Bot deleted successfully', {
      userId,
      botId,
      botName: bot.name
    });

    return NextResponse.json({
      success: true,
      message: 'Bot supprimé avec succès',
      botId
    });

  } catch (error) {
    log.error('[Delete API] Failed to delete bot', { error });
    return NextResponse.json({
      error: 'Failed to delete bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}