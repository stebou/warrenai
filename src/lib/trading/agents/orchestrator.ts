import { TradingEngine } from '../engine/engine';

export class Orchestrator {
  constructor(private engine: TradingEngine) {}

  async syncDecisions() {
    // synchroniser décisions IA vers engine
  }
}