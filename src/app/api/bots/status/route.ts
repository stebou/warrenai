import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { BotController } from '@/lib/trading/bot/bot_controller';
import { DatabasePersistence } from '@/lib/trading/bot/db_persistence';
import { log } from '@/lib/logger';

export async function GET() {
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
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        strategy: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        aiConfig: true
      }
    });

    // Récupérer le statut des bots actifs
    const botController = BotController.getInstance();
    const activeBots = botController.getActiveBots();
    const stats = botController.getStats();


    // Récupérer les stats depuis la base de données (source de vérité unique)
    const botsWithStatus = await Promise.all(
      userBots.map(async bot => {
        // Charger les stats depuis la DB
        const dbStats = await DatabasePersistence.loadBotStats(bot.id);
        const botInstance = botController.getBotInstance(bot.id);
        const isRunningInController = !!botInstance;
        const isRunningInDB = dbStats?.isRunning || false;
        
        // Un bot est considéré comme "running" s'il est marqué running dans la DB ET dans le controller
        const isActuallyRunning = isRunningInDB && isRunningInController;
        
        // Si le bot est marqué comme running dans la DB mais pas dans le controller, le récupérer
        if (isRunningInDB && !isRunningInController && bot.status === 'ACTIVE') {
          try {
            await botController.startBot(bot);
            log.info('[Bot Status] Auto-recovered bot from DB stats', { botId: bot.id });
          } catch (error) {
            log.error('[Bot Status] Failed to recover bot', { 
              botId: bot.id, 
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        return {
          // Données de base du bot
          id: bot.id,
          name: bot.name,
          description: bot.description,
          strategy: bot.strategy,
          createdAt: bot.createdAt,
          updatedAt: bot.updatedAt,
          aiConfig: bot.aiConfig,
          // États de trading basés sur la DB (source de vérité)
          status: isActuallyRunning ? 'running' : 'stopped',
          runtime: dbStats?.startedAt 
            ? Date.now() - dbStats.startedAt.getTime()
            : 0,
          stats: dbStats ? {
            trades: dbStats.trades,
            profit: dbStats.profit,
            errors: dbStats.errors,
            winningTrades: dbStats.winningTrades,
            losingTrades: dbStats.losingTrades,
            winRate: dbStats.trades > 0 ? (dbStats.winningTrades / dbStats.trades * 100) : 0
          } : { trades: 0, profit: 0, errors: 0, winningTrades: 0, losingTrades: 0, winRate: 0 },
          lastAction: dbStats?.lastAction?.getTime(),
          // Debug info
          dbStatus: bot.status,
          controllerRunning: isRunningInController
        };
      })
    );

    // Obtenir les stats filtrées par utilisateur - SÉCURISÉ
    const userStats = await DatabasePersistence.getUserStats(user.id);

    log.info('[Bot Status API] User-specific stats retrieved securely', {
      userId,
      clerkId: userId,
      dbUserId: user.id,
      totalBots: userBots.length,
      activeBots: userStats.activeBots,
      totalTrades: userStats.totalTrades,
      totalProfit: userStats.totalProfit,
      winningTrades: userStats.totalWinningTrades,
      losingTrades: userStats.totalLosingTrades,
      winRate: userStats.winRate
    });

    return NextResponse.json({
      success: true,
      bots: botsWithStatus,
      summary: {
        totalBots: userBots.length,
        activeBots: userStats.activeBots,
        totalTrades: userStats.totalTrades,
        totalProfit: userStats.totalProfit,
        totalErrors: userStats.totalErrors,
        totalWinningTrades: userStats.totalWinningTrades,
        totalLosingTrades: userStats.totalLosingTrades,
        winRate: userStats.winRate
      }
    });

  } catch (error) {
    log.error('[Bot Status API] Failed to get status', { error });
    return NextResponse.json({
      error: 'Failed to get bot status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    // Récupérer le statut détaillé du bot
    const botController = BotController.getInstance();
    const botInstance = botController.getBotInstance(botId);

    if (!botInstance) {
      return NextResponse.json({
        success: true,
        bot: {
          id: bot.id,
          name: bot.name,
          strategy: bot.strategy,
          status: 'stopped',
          runtime: 0,
          stats: { trades: 0, profit: 0, errors: 0 }
        }
      });
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: bot.id,
        name: bot.name,
        strategy: bot.strategy,
        status: 'running',
        runtime: Date.now() - (botInstance.startedAt || 0),
        stats: botInstance.stats,
        lastAction: botInstance.lastAction,
        config: {
          tradingFrequency: botInstance.bot.aiConfig,
          exchange: 'MockExchange'
        }
      }
    });

  } catch (error) {
    log.error('[Bot Status API] Failed to get individual bot status', { error });
    return NextResponse.json({
      error: 'Failed to get bot status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}