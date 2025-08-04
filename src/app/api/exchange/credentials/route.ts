// src/app/api/exchange/credentials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { BinanceExchange } from '@/lib/trading/exchanges/binance_exchange';
import { z } from 'zod';

// Schema de validation pour les clés d'exchange
const ExchangeCredentialsSchema = z.object({
  exchange: z.enum(['BINANCE', 'BINANCE_FUTURES']),
  apiKey: z.string().min(1, 'API Key est requis'),
  apiSecret: z.string().min(1, 'API Secret est requis'),
  isTestnet: z.boolean().default(true),
  label: z.string().optional()
});

// GET - Récupérer les clés d'exchange de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les clés d'exchange (sans les secrets pour des raisons de sécurité)
    const credentials = await prisma.exchangeCredentials.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        exchange: true,
        apiKey: true,
        // apiSecret: false, // Ne jamais renvoyer le secret
        isTestnet: true,
        isActive: true,
        label: true,
        createdAt: true,
        lastUsed: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Masquer partiellement les clés API pour la sécurité
    const maskedCredentials = credentials.map(cred => ({
      ...cred,
      apiKey: cred.apiKey.substring(0, 8) + '...' + cred.apiKey.substring(cred.apiKey.length - 4)
    }));

    return NextResponse.json({ 
      credentials: maskedCredentials,
      count: credentials.length 
    });

  } catch (error) {
    log.error('[API] Error fetching exchange credentials', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

// POST - Ajouter de nouvelles clés d'exchange
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = ExchangeCredentialsSchema.parse(body);

    // Vérifier si l'utilisateur a déjà des clés pour cet exchange/environnement
    const existingCredentials = await prisma.exchangeCredentials.findFirst({
      where: {
        userId: user.id,
        exchange: validatedData.exchange,
        isTestnet: validatedData.isTestnet
      }
    });

    let isUpdate = false;
    if (existingCredentials) {
      // Si les credentials existent, on va les mettre à jour
      isUpdate = true;
      log.info('[API] Updating existing credentials', {
        userId: user.id,
        exchange: validatedData.exchange,
        isTestnet: validatedData.isTestnet
      });
    }

    // Tester la validité des clés en tentant une connexion
    try {
      const testExchange = new BinanceExchange({
        apiKey: validatedData.apiKey,
        apiSecret: validatedData.apiSecret,
        testnet: validatedData.isTestnet
      });

      await testExchange.connect();
      await testExchange.getAccountInfo(); // Test simple pour vérifier les permissions
      await testExchange.disconnect();

      log.info('[API] Binance credentials tested successfully', { 
        userId: user.id,
        exchange: validatedData.exchange,
        isTestnet: validatedData.isTestnet
      });

    } catch (testError) {
      log.error('[API] Invalid Binance credentials provided', { 
        error: testError,
        userId: user.id,
        exchange: validatedData.exchange 
      });
      
      return NextResponse.json({ 
        error: 'Clés API invalides ou permissions insuffisantes' 
      }, { status: 400 });
    }

    // Sauvegarder ou mettre à jour les clés en base de données
    // ATTENTION: En production, il faudrait chiffrer les clés
    const credentialsData = {
      userId: user.id,
      exchange: validatedData.exchange,
      apiKey: validatedData.apiKey,
      apiSecret: validatedData.apiSecret, // TODO: Chiffrer en production
      isTestnet: validatedData.isTestnet,
      label: validatedData.label,
      isActive: true,
      lastUsed: new Date()
    };

    const upsertedCredentials = await prisma.exchangeCredentials.upsert({
      where: {
        userId_exchange_isTestnet: {
          userId: user.id,
          exchange: validatedData.exchange,
          isTestnet: validatedData.isTestnet
        }
      },
      update: {
        apiKey: validatedData.apiKey,
        apiSecret: validatedData.apiSecret,
        label: validatedData.label,
        isActive: true,
        lastUsed: new Date(),
        updatedAt: new Date()
      },
      create: credentialsData,
      select: {
        id: true,
        exchange: true,
        apiKey: true,
        isTestnet: true,
        isActive: true,
        label: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Masquer la clé API dans la réponse
    const response = {
      ...upsertedCredentials,
      apiKey: upsertedCredentials.apiKey.substring(0, 8) + '...' + upsertedCredentials.apiKey.substring(upsertedCredentials.apiKey.length - 4)
    };

    log.info(`[API] Exchange credentials ${isUpdate ? 'updated' : 'saved'} successfully`, { 
      userId: user.id,
      credentialsId: upsertedCredentials.id,
      exchange: validatedData.exchange,
      isTestnet: validatedData.isTestnet,
      isUpdate
    });

    return NextResponse.json({ 
      message: `Clés d'exchange ${isUpdate ? 'mises à jour' : 'sauvegardées'} avec succès`,
      credentials: response,
      isUpdate
    }, { status: isUpdate ? 200 : 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 });
    }

    log.error('[API] Error saving exchange credentials', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour des clés d'exchange
export async function PUT(request: NextRequest) {
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
    const { credentialsId, ...updateData } = body;

    if (!credentialsId) {
      return NextResponse.json({ error: 'ID des clés requis' }, { status: 400 });
    }

    // Vérifier que les clés appartiennent à l'utilisateur
    const existingCredentials = await prisma.exchangeCredentials.findFirst({
      where: {
        id: credentialsId,
        userId: user.id
      }
    });

    if (!existingCredentials) {
      return NextResponse.json({ error: 'Clés non trouvées' }, { status: 404 });
    }

    // Si de nouvelles clés sont fournies, les tester
    if (updateData.apiKey && updateData.apiSecret) {
      try {
        const testExchange = new BinanceExchange({
          apiKey: updateData.apiKey,
          apiSecret: updateData.apiSecret,
          testnet: existingCredentials.isTestnet
        });

        await testExchange.connect();
        await testExchange.getAccountInfo();
        await testExchange.disconnect();

      } catch (testError) {
        return NextResponse.json({ 
          error: 'Nouvelles clés API invalides' 
        }, { status: 400 });
      }
    }

    // Mettre à jour les clés
    const updatedCredentials = await prisma.exchangeCredentials.update({
      where: { id: credentialsId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        exchange: true,
        apiKey: true,
        isTestnet: true,
        isActive: true,
        label: true,
        updatedAt: true
      }
    });

    // Masquer la clé API dans la réponse
    const response = {
      ...updatedCredentials,
      apiKey: updatedCredentials.apiKey.substring(0, 8) + '...' + updatedCredentials.apiKey.substring(updatedCredentials.apiKey.length - 4)
    };

    log.info('[API] Exchange credentials updated successfully', { 
      userId: user.id,
      credentialsId 
    });

    return NextResponse.json({ 
      message: 'Clés mises à jour avec succès',
      credentials: response
    });

  } catch (error) {
    log.error('[API] Error updating exchange credentials', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

// DELETE - Supprimer des clés d'exchange
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const credentialsId = searchParams.get('id');

    if (!credentialsId) {
      return NextResponse.json({ error: 'ID des clés requis' }, { status: 400 });
    }

    // Vérifier que les clés appartiennent à l'utilisateur
    const existingCredentials = await prisma.exchangeCredentials.findFirst({
      where: {
        id: credentialsId,
        userId: user.id
      }
    });

    if (!existingCredentials) {
      return NextResponse.json({ error: 'Clés non trouvées' }, { status: 404 });
    }

    // Supprimer les clés
    await prisma.exchangeCredentials.delete({
      where: { id: credentialsId }
    });

    log.info('[API] Exchange credentials deleted successfully', { 
      userId: user.id,
      credentialsId 
    });

    return NextResponse.json({ 
      message: 'Clés supprimées avec succès' 
    });

  } catch (error) {
    log.error('[API] Error deleting exchange credentials', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}