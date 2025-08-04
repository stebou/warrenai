// tests/mock-exchange.test.js
/**
 * Tests pour le MockExchange
 * Valide toutes les fonctionnalités de base
 */

import { strict as assert } from 'assert';

// Mock des classes pour les tests
class MockExchange {
  constructor() {
    this.connected = false;
    this.orders = new Map();
    this.balances = new Map([
      ['USDT', { asset: 'USDT', free: 10000, locked: 0, total: 10000 }],
      ['BTC', { asset: 'BTC', free: 1, locked: 0, total: 1 }]
    ]);
    this.orderIdCounter = 1;
  }

  async connect() {
    await new Promise(resolve => setTimeout(resolve, 10));
    this.connected = true;
  }

  isConnected() {
    return this.connected;
  }

  async getTicker(symbol) {
    if (!this.connected) throw new Error('Exchange not connected');
    
    return {
      symbol,
      price: symbol === 'BTC/USDT' ? 45000 : 2800,
      change24h: 500,
      changePercent24h: 1.12,
      volume24h: 123456,
      high24h: 46000,
      low24h: 44000,
      timestamp: Date.now()
    };
  }

  async getBalance(asset) {
    if (!this.connected) throw new Error('Exchange not connected');
    
    if (asset) {
      const balance = this.balances.get(asset);
      return balance ? [balance] : [];
    }
    
    return Array.from(this.balances.values());
  }

  async placeOrder(orderRequest) {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const orderId = `mock_order_${this.orderIdCounter++}`;
    const order = {
      id: orderId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      status: orderRequest.type === 'MARKET' ? 'FILLED' : 'PENDING',
      filled: orderRequest.type === 'MARKET' ? orderRequest.quantity : 0,
      remaining: orderRequest.type === 'MARKET' ? 0 : orderRequest.quantity,
      timestamp: Date.now(),
      updatedAt: Date.now()
    };

    this.orders.set(orderId, order);
    return order;
  }

  async getOpenOrders(symbol) {
    if (!this.connected) throw new Error('Exchange not connected');
    
    return Array.from(this.orders.values()).filter(order => 
      order.status === 'PENDING' && (!symbol || order.symbol === symbol)
    );
  }
}

// Tests
async function runMockExchangeTests() {
  console.log('🧪 Tests MockExchange...\n');

  // Test 1: Connexion
  await test('Connexion à l\'exchange', async () => {
    const exchange = new MockExchange();
    assert.strictEqual(exchange.isConnected(), false, 'Exchange devrait être déconnecté au début');
    
    await exchange.connect();
    assert.strictEqual(exchange.isConnected(), true, 'Exchange devrait être connecté après connect()');
    
    console.log('✅ Test 1 réussi: Connexion');
  });

  // Test 2: Récupération des données de marché
  await test('Récupération ticker', async () => {
    const exchange = new MockExchange();
    await exchange.connect();
    
    const ticker = await exchange.getTicker('BTC/USDT');
    
    assert.strictEqual(ticker.symbol, 'BTC/USDT', 'Symbol devrait correspondre');
    assert.strictEqual(typeof ticker.price, 'number', 'Price devrait être un nombre');
    assert.strictEqual(typeof ticker.timestamp, 'number', 'Timestamp devrait être un nombre');
    assert(ticker.price > 0, 'Price devrait être positive');
    
    console.log('✅ Test 2 réussi: Ticker récupéré', ticker.price);
  });

  // Test 3: Récupération des balances
  await test('Récupération balances', async () => {
    const exchange = new MockExchange();
    await exchange.connect();
    
    const balances = await exchange.getBalance();
    
    assert(Array.isArray(balances), 'Balances devrait être un array');
    assert(balances.length > 0, 'Devrait avoir au moins une balance');
    
    const usdtBalance = balances.find(b => b.asset === 'USDT');
    assert(usdtBalance, 'Devrait avoir une balance USDT');
    assert.strictEqual(usdtBalance.free, 10000, 'Balance USDT devrait être 10000');
    
    console.log('✅ Test 3 réussi: Balances récupérées', balances.length, 'assets');
  });

  // Test 4: Placement d'ordre MARKET
  await test('Placement ordre MARKET', async () => {
    const exchange = new MockExchange();
    await exchange.connect();
    
    const orderRequest = {
      symbol: 'BTC/USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001
    };
    
    const order = await exchange.placeOrder(orderRequest);
    
    assert.strictEqual(order.symbol, 'BTC/USDT', 'Symbol devrait correspondre');
    assert.strictEqual(order.side, 'BUY', 'Side devrait correspondre');
    assert.strictEqual(order.type, 'MARKET', 'Type devrait correspondre');
    assert.strictEqual(order.status, 'FILLED', 'Ordre MARKET devrait être FILLED');
    assert.strictEqual(order.filled, 0.001, 'Quantité filled devrait correspondre');
    
    console.log('✅ Test 4 réussi: Ordre MARKET placé', order.id);
  });

  // Test 5: Placement d'ordre LIMIT
  await test('Placement ordre LIMIT', async () => {
    const exchange = new MockExchange();
    await exchange.connect();
    
    const orderRequest = {
      symbol: 'BTC/USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 0.001,
      price: 40000 // Prix en dessous du marché
    };
    
    const order = await exchange.placeOrder(orderRequest);
    
    assert.strictEqual(order.type, 'LIMIT', 'Type devrait être LIMIT');
    assert.strictEqual(order.status, 'PENDING', 'Ordre LIMIT devrait être PENDING');
    assert.strictEqual(order.filled, 0, 'Quantité filled devrait être 0');
    assert.strictEqual(order.remaining, 0.001, 'Quantité remaining devrait correspondre');
    
    console.log('✅ Test 5 réussi: Ordre LIMIT placé', order.id);
  });

  // Test 6: Récupération des ordres ouverts
  await test('Récupération ordres ouverts', async () => {
    const exchange = new MockExchange();
    await exchange.connect();
    
    // Placer quelques ordres
    await exchange.placeOrder({
      symbol: 'BTC/USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 0.001,
      price: 40000
    });
    
    await exchange.placeOrder({
      symbol: 'ETH/USDT',
      side: 'SELL',
      type: 'LIMIT',
      quantity: 0.1,
      price: 3000
    });
    
    const openOrders = await exchange.getOpenOrders();
    assert.strictEqual(openOrders.length, 2, 'Devrait avoir 2 ordres ouverts');
    
    const btcOrders = await exchange.getOpenOrders('BTC/USDT');
    assert.strictEqual(btcOrders.length, 1, 'Devrait avoir 1 ordre BTC ouvert');
    
    console.log('✅ Test 6 réussi: Ordres ouverts récupérés');
  });

  // Test 7: Gestion d'erreur sans connexion
  await test('Gestion erreur sans connexion', async () => {
    const exchange = new MockExchange();
    
    try {
      await exchange.getTicker('BTC/USDT');
      assert.fail('Devrait lever une erreur');
    } catch (error) {
      assert.strictEqual(error.message, 'Exchange not connected', 'Message d\'erreur devrait correspondre');
    }
    
    console.log('✅ Test 7 réussi: Erreur gérée correctement');
  });

  console.log('\n🎉 Tous les tests MockExchange sont passés !');
}

// Helper pour les tests
async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    console.error(`❌ Test échoué: ${name}`);
    console.error(`   Erreur: ${error.message}`);
    throw error;
  }
}

// Exécuter les tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runMockExchangeTests().catch(console.error);
}

export { runMockExchangeTests };