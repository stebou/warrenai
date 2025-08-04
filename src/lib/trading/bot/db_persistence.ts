// Système de persistance basé sur la base de données (inspiré des bots professionnels)
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import type { BotInstance } from './bot_controller';

export interface BotStatsData {
  botId: string;
  startedAt: Date;
  lastAction?: Date;
  trades: number;
  profit: number;
  errors: number;
  winningTrades: number;
  losingTrades: number;
  isRunning: boolean;
  sessionData?: any;
}

export class DatabasePersistence {
  
  // Sauvegarder ou mettre à jour les stats d'un bot
  static async upsertBotStats(botInstance: BotInstance): Promise<void> {
    try {
      const statsData: BotStatsData = {
        botId: botInstance.bot.id,
        startedAt: new Date(botInstance.startedAt || Date.now()),
        lastAction: botInstance.lastAction ? new Date(botInstance.lastAction) : undefined,
        trades: botInstance.stats?.trades || 0,
        profit: botInstance.stats?.profit || 0,
        errors: botInstance.stats?.errors || 0,
        winningTrades: botInstance.stats?.winningTrades || 0,
        losingTrades: botInstance.stats?.losingTrades || 0,
        isRunning: botInstance.isRunning,
        sessionData: {
          strategy: botInstance.bot.strategy,
          intervalId: !!botInstance.intervalId,
          positions: botInstance.positions ? Array.from(botInstance.positions.entries()) : []
        }
      };

      await prisma.botStats.upsert({
        where: { botId: botInstance.bot.id },
        update: {
          lastAction: statsData.lastAction,
          trades: statsData.trades,
          profit: statsData.profit,
          errors: statsData.errors,
          winningTrades: statsData.winningTrades,
          losingTrades: statsData.losingTrades,
          isRunning: statsData.isRunning,
          sessionData: statsData.sessionData,
        },
        create: statsData
      });

      log.debug('[DatabasePersistence] Bot stats persisted', {
        botId: botInstance.bot.id,
        stats: statsData
      });

    } catch (error) {
      log.error('[DatabasePersistence] Failed to persist bot stats', {
        botId: botInstance.bot.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Charger les stats d'un bot depuis la DB
  static async loadBotStats(botId: string): Promise<BotStatsData | null> {
    try {
      const stats = await prisma.botStats.findUnique({
        where: { botId }
      });

      if (!stats) {
        return null;
      }

      return {
        botId: stats.botId,
        startedAt: stats.startedAt,
        lastAction: stats.lastAction || undefined,
        trades: stats.trades,
        profit: stats.profit,
        errors: stats.errors,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        isRunning: stats.isRunning,
        sessionData: stats.sessionData
      };

    } catch (error) {
      log.error('[DatabasePersistence] Failed to load bot stats', {
        botId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  // Charger tous les bots marqués comme actifs
  static async loadActiveBots(): Promise<BotStatsData[]> {
    try {
      const activeStats = await prisma.botStats.findMany({
        where: { isRunning: true },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              strategy: true,
              status: true
            }
          }
        }
      });

      log.info('[DatabasePersistence] Loaded active bots from DB', {
        count: activeStats.length,
        botIds: activeStats.map(s => s.botId)
      });

      return activeStats.map(stats => ({
        botId: stats.botId,
        startedAt: stats.startedAt,
        lastAction: stats.lastAction || undefined,
        trades: stats.trades,
        profit: stats.profit,
        errors: stats.errors,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        isRunning: stats.isRunning,
        sessionData: stats.sessionData
      }));

    } catch (error) {
      log.error('[DatabasePersistence] Failed to load active bots', { error });
      return [];
    }
  }

  // Marquer un bot comme arrêté
  static async markBotStopped(botId: string): Promise<void> {
    try {
      await prisma.botStats.updateMany({
        where: { botId },
        data: { 
          isRunning: false,
          lastAction: new Date()
        }
      });

      log.info('[DatabasePersistence] Bot marked as stopped', { botId });

    } catch (error) {
      log.error('[DatabasePersistence] Failed to mark bot as stopped', {
        botId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Nettoyer les stats anciennes (optionnel)
  static async cleanupOldStats(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await prisma.botStats.deleteMany({
        where: {
          isRunning: false,
          updatedAt: {
            lt: cutoffDate
          }
        }
      });

      log.info('[DatabasePersistence] Cleaned up old stats', {
        deletedCount: deleted.count,
        olderThanDays
      });

    } catch (error) {
      log.error('[DatabasePersistence] Failed to cleanup old stats', { error });
    }
  }

  // Obtenir un résumé des stats par utilisateur - SÉCURISÉ
  static async getUserStats(userId: string): Promise<{
    totalTrades: number;
    totalProfit: number;
    totalErrors: number;
    totalWinningTrades: number;
    totalLosingTrades: number;
    activeBots: number;
    winRate: number;
  }> {
    try {
      // Filtrage sécurisé par utilisateur - seuls les bots de cet utilisateur
      const aggregateStats = await prisma.botStats.aggregate({
        _sum: {
          trades: true,
          profit: true,
          errors: true,
          winningTrades: true,
          losingTrades: true
        },
        _count: {
          _all: true
        },
        where: {
          isRunning: true,
          bot: {
            user: {
              id: userId // FILTRE CRITIQUE : seuls les bots de cet utilisateur
            }
          }
        }
      });

      const totalTrades = aggregateStats._sum.trades || 0;
      const totalWinningTrades = aggregateStats._sum.winningTrades || 0;
      const totalLosingTrades = aggregateStats._sum.losingTrades || 0;
      const winRate = totalTrades > 0 ? (totalWinningTrades / totalTrades * 100) : 0;

      log.info('[DatabasePersistence] User stats retrieved securely', {
        userId,
        totalTrades,
        activeBots: aggregateStats._count._all || 0,
        winRate: winRate.toFixed(1)
      });

      return {
        totalTrades,
        totalProfit: aggregateStats._sum.profit || 0,
        totalErrors: aggregateStats._sum.errors || 0,
        totalWinningTrades,
        totalLosingTrades,
        activeBots: aggregateStats._count._all || 0,
        winRate
      };

    } catch (error) {
      log.error('[DatabasePersistence] Failed to get user stats', { userId, error });
      return {
        totalTrades: 0,
        totalProfit: 0,
        totalErrors: 0,
        totalWinningTrades: 0,
        totalLosingTrades: 0,
        activeBots: 0,
        winRate: 0
      };
    }
  }
}