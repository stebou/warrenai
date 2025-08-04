import { NextRequest, NextResponse } from 'next/server';
import { CoinbaseAdvancedClient } from '@/lib/trading/exchanges/coinbase_advanced_client_v2';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Vérifier que les variables d'environnement sont configurées
    const apiKeyName = process.env.COINBASE_ADVANCED_API_KEY;
    const privateKey = process.env.COINBASE_ADVANCED_API_SECRET;
    
    if (!apiKeyName || !privateKey) {
      return NextResponse.json({
        success: false,
        error: 'Variables CDP manquantes (COINBASE_ADVANCED_API_KEY et COINBASE_ADVANCED_API_SECRET)'
      });
    }

    console.log('🔍 Test de connexion CDP Coinbase pour userId:', userId);
    console.log('📋 API Key:', apiKeyName.substring(0, 40) + '...');

    // Créer le client Coinbase
    const coinbaseClient = new CoinbaseAdvancedClient({
      apiKeyName,
      privateKey,
      sandbox: false
    });

    // Tester la connexion
    const isConnected = await coinbaseClient.testConnection();
    
    if (isConnected) {
      // Récupérer quelques informations de base pour confirmer
      const accounts = await coinbaseClient.getAccounts();
      
      console.log('✅ Test CDP réussi:', {
        userId,
        accountsCount: accounts.length,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Connexion CDP Coinbase réussie',
        data: {
          accountsCount: accounts.length,
          connectedAt: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ Test CDP échoué pour userId:', userId);
      return NextResponse.json({
        success: false,
        error: 'Impossible de se connecter à Coinbase avec les clés CDP configurées'
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur test connexion CDP:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors du test de connexion CDP'
    });
  }
}