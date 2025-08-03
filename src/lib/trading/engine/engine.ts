import EventEmitter from 'events';
import { TradingStrategy } from '../strategies/strategy_manager';

export class TradingEngine extends EventEmitter {
  private strategies: Map<string, TradingStrategy> = new Map();
  private running = false;

  async start() {
    this.running = true;
    // boucle principale ou scheduler
    console.log('[Engine] Started');
  }

  async stop() {
    this.running = false;
    console.log('[Engine] Stopped');
  }

  async add_strategy(id: string, strategy: TradingStrategy) {
    this.strategies.set(id, strategy);
    console.log(`[Engine] Strategy ${id} added`);
    return id;
  }

  async remove_strategy(id: string) {
    return this.strategies.delete(id);
  }

  async get_performance_metrics() {
    return {
      activeStrategies: this.strategies.size,
    };
  }

  async emergency_stop() {
    this.running = false;
    console.warn('[Engine] Emergency stop triggered');
  }
}