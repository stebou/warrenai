// Système de persistance pour les bots actifs
import fs from 'fs/promises';
import path from 'path';
import { log } from '@/lib/logger';

interface PersistedBotState {
  id: string;
  startedAt: number;
  stats: {
    trades: number;
    profit: number;
    errors: number;
  };
  lastAction?: number;
}

export class BotPersistence {
  private static readonly PERSISTENCE_FILE = path.join(process.cwd(), 'data', 'active-bots.json');

  // Sauvegarder l'état des bots actifs
  static async saveActiveBots(activeBots: Map<string, any>): Promise<void> {
    try {
      // Créer le dossier data s'il n'existe pas
      const dataDir = path.dirname(this.PERSISTENCE_FILE);
      await fs.mkdir(dataDir, { recursive: true });

      const persistedStates: PersistedBotState[] = Array.from(activeBots.entries()).map(([id, botInstance]) => ({
        id,
        startedAt: botInstance.startedAt || Date.now(),
        stats: botInstance.stats || { trades: 0, profit: 0, errors: 0 },
        lastAction: botInstance.lastAction
      }));

      await fs.writeFile(this.PERSISTENCE_FILE, JSON.stringify(persistedStates, null, 2));
      
      log.info('[BotPersistence] Saved active bots state', {
        count: persistedStates.length,
        botIds: persistedStates.map(b => b.id)
      });
    } catch (error) {
      log.error('[BotPersistence] Failed to save active bots', { error });
    }
  }

  // Charger l'état des bots actifs
  static async loadActiveBots(): Promise<PersistedBotState[]> {
    try {
      const data = await fs.readFile(this.PERSISTENCE_FILE, 'utf-8');
      const persistedStates = JSON.parse(data) as PersistedBotState[];
      
      log.info('[BotPersistence] Loaded active bots state', {
        count: persistedStates.length,
        botIds: persistedStates.map(b => b.id)
      });
      
      return persistedStates;
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        log.error('[BotPersistence] Failed to load active bots', { error });
      }
      return [];
    }
  }

  // Supprimer un bot de la persistance
  static async removeBotFromPersistence(botId: string): Promise<void> {
    try {
      const persistedStates = await this.loadActiveBots();
      const filteredStates = persistedStates.filter(state => state.id !== botId);
      
      if (filteredStates.length !== persistedStates.length) {
        await fs.writeFile(this.PERSISTENCE_FILE, JSON.stringify(filteredStates, null, 2));
        log.info('[BotPersistence] Removed bot from persistence', { botId });
      }
    } catch (error) {
      log.error('[BotPersistence] Failed to remove bot from persistence', { botId, error });
    }
  }

  // Nettoyer la persistance
  static async clearPersistence(): Promise<void> {
    try {
      await fs.unlink(this.PERSISTENCE_FILE);
      log.info('[BotPersistence] Cleared persistence file');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        log.error('[BotPersistence] Failed to clear persistence', { error });
      }
    }
  }
}