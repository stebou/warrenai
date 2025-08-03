export interface BaseExchange {
  connect(): Promise<void>;
  placeOrder(order: any): Promise<any>;
  getMarketData(symbol: string): Promise<any>;
}