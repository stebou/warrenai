export class TradingEngine {
  private running = false;

  async start(): Promise<void> {
    this.running = true;
    console.log('Engine started');
  }

  async stop(): Promise<void> {
    this.running = false;
    console.log('Engine stopped');
  }

  async add_strategy(strategy: any): Promise<string> {
    // stub
    return 'strategy-id';
  }

  async remove_strategy(strategy_id: string): Promise<boolean> {
    return true;
  }

  async get_performance_metrics(): Promise<Record<string, any>> {
    return { latency_us: 0 };
  }

  async emergency_stop(): Promise<void> {
    console.log('Emergency stop triggered');
  }
}