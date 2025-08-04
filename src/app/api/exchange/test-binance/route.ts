// src/app/api/exchange/test-binance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { BinanceExchange } from '@/lib/trading/exchanges/binance_exchange';

// POST - Tester la connexion Binance avec les clés de l'utilisateur
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const { exchange = 'BINANCE', isTestnet = true } = body;

    // Récupérer les clés de l'utilisateur
    const credentials = await prisma.exchangeCredentials.findFirst({
      where: {
        userId: user.id,
        exchange,
        isTestnet,
        isActive: true
      }
    });

    if (!credentials) {
      return NextResponse.json({ 
        error: `Aucune clé ${isTestnet ? 'testnet' : 'mainnet'} trouvée pour ${exchange}` 
      }, { status: 404 });
    }

    // Tester la connexion Binance
    const binanceExchange = new BinanceExchange({
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      testnet: isTestnet
    });

    let testResults = {
      connection: false,
      accountInfo: null,
      exchangeInfo: null,
      balance: null,
      ticker: null,
      error: null
    };

    try {
      // Test 1: Connexion de base
      await binanceExchange.connect();
      testResults.connection = true;

      // Test 2: Informations du compte
      try {
        const accountInfo = await binanceExchange.getAccountInfo();
        testResults.accountInfo = {
          canTrade: accountInfo.canTrade,
          canWithdraw: accountInfo.canWithdraw,
          canDeposit: accountInfo.canDeposit,
          balanceCount: accountInfo.balances.length,
          makerCommission: accountInfo.makerCommission,
          takerCommission: accountInfo.takerCommission
        };
      } catch (error) {
        log.warn('[Test Binance] Account info failed', { error });
      }

      // Test 3: Informations de l'exchange
      try {
        const exchangeInfo = await binanceExchange.getExchangeInfo();
        testResults.exchangeInfo = {
          name: exchangeInfo.name,
          symbolCount: exchangeInfo.symbols.length,
          rateLimits: exchangeInfo.rateLimits.length
        };
      } catch (error) {
        log.warn('[Test Binance] Exchange info failed', { error });
      }

      // Test 4: Balance USDT (si disponible)
      try {
        const usdtBalance = await binanceExchange.getBalance('USDT');
        if (usdtBalance.length > 0) {
          testResults.balance = {
            asset: 'USDT',
            free: usdtBalance[0].free,
            locked: usdtBalance[0].locked,
            total: usdtBalance[0].total
          };
        }
      } catch (error) {
        log.warn('[Test Binance] Balance check failed', { error });
      }

      // Test 5: Ticker BTC/USDT
      try {
        const ticker = await binanceExchange.getTicker('BTC/USDT');
        testResults.ticker = {
          symbol: ticker.symbol,
          price: ticker.price,
          change24h: ticker.changePercent24h
        };
      } catch (error) {
        log.warn('[Test Binance] Ticker check failed', { error });
      }

      await binanceExchange.disconnect();

      // Mettre à jour la date de dernière utilisation
      await prisma.exchangeCredentials.update({
        where: { id: credentials.id },
        data: { lastUsed: new Date() }
      });

      log.info('[Test Binance] Connection test successful', { 
        userId: user.id,
        exchange,
        isTestnet,
        hasAccountInfo: !!testResults.accountInfo,
        hasBalance: !!testResults.balance,
        hasTicker: !!testResults.ticker
      });

      return NextResponse.json({
        success: true,
        message: 'Connexion Binance réussie',
        testResults,
        timestamp: new Date().toISOString()
      });

    } catch (connectionError) {
      testResults.error = connectionError instanceof Error ? connectionError.message : 'Erreur de connexion inconnue';
      
      log.error('[Test Binance] Connection test failed', { 
        error: connectionError,
        userId: user.id,
        exchange,
        isTestnet
      });

      return NextResponse.json({
        success: false,
        message: 'Échec de la connexion Binance',
        testResults,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

  } catch (error) {
    log.error('[Test Binance] API error', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

// GET - Obtenir le statut de connexion rapide
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer toutes les clés actives de l'utilisateur
    const allCredentials = await prisma.exchangeCredentials.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        exchange: true,
        isTestnet: true,
        lastUsed: true,
        createdAt: true,
        label: true
      },
      orderBy: { lastUsed: 'desc' }
    });

    const status = {
      hasCredentials: allCredentials.length > 0,
      credentials: allCredentials.map(cred => ({
        id: cred.id,
        exchange: cred.exchange,
        isTestnet: cred.isTestnet,
        label: cred.label,
        lastUsed: cred.lastUsed,
        daysSinceLastUse: cred.lastUsed ? 
          Math.floor((Date.now() - cred.lastUsed.getTime()) / (1000 * 60 * 60 * 24)) : 
          null
      })),
      testnetCount: allCredentials.filter(c => c.isTestnet).length,
      mainnetCount: allCredentials.filter(c => !c.isTestnet).length
    };

    return NextResponse.json(status);

  } catch (error) {
    log.error('[Test Binance] Status check error', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}