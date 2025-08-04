import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { generateBotFromConfig, type BotCreationConfig } from '@/lib/trading/agents/bot_creation/agent';
import { BotStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ensureUserExists } from '@/lib/auth/sync-user';

export async function POST(req: Request) {
  try {
    // 1. Authentification et récupération de l'ID utilisateur
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1.5. Assurer que l'utilisateur existe en base de données
    await ensureUserExists(userId);

    // 2. Validation du corps de la requête
    const body = await req.json() as BotCreationConfig;
    if (!body.name || !body.riskLimits) {
        return NextResponse.json({ error: 'Invalid input: name and riskLimits are required.' }, { status: 400 });
    }

    // 3. Appel de l'agent pour générer la spécification complète du bot
    log.info('Calling bot creation agent', { name: body.name });
    const botSpec = await generateBotFromConfig(body);

    // 4. Création du bot dans la base de données avec la promptVersion et la traçabilité
    const newBot = await prisma.bot.create({
      data: {
        name: botSpec.name,
        description: body.description || botSpec.description,
        strategy: botSpec.strategy,
        aiConfig: botSpec.aiConfig,
        status: BotStatus.INACTIVE,
        promptVersion: botSpec.promptVersion,
        
        // Remplissage des nouveaux champs de traçabilité
        promptText: botSpec.aiConfig.prompt,
        source: botSpec.aiConfig.source,
        model: botSpec.aiConfig.model,
        generatedAt: botSpec.aiConfig.generatedAt ? new Date(botSpec.aiConfig.generatedAt) : null,

        user: { 
          connect: { clerkId: userId },
        },
      },
    });

    log.info('Bot created successfully in DB', { botId: newBot.id, ownerClerkId: userId });

    // 5. Retourner une réponse de succès avec informations enrichies
    return NextResponse.json({
      ...newBot,
      validationInfo: {
        riskLevel: body.riskLevel || 'auto-calculated',
        configCompliance: 'valid',
        strategiesApplied: body.strategyHints || [],
        riskScore: {
          maxAllocation: body.riskLimits.maxAllocation,
          maxDailyLoss: body.riskLimits.maxDailyLoss,
          calculatedLevel: body.riskLevel || 'medium'
        }
      }
    }, { status: 201 });

  } catch (error) {
    // Logging détaillé pour diagnostiquer le problème
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : null,
      code: error && typeof error === 'object' && 'code' in error ? error.code : null,
      meta: error && typeof error === 'object' && 'meta' in error ? error.meta : null,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    
    log.error('Failed to create bot - detailed error', errorInfo);

    // Gestion d'erreur améliorée avec détails pour le debug
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      log.error('Prisma error details', { code: error.code, meta: error.meta });
      
      // Erreur spécifique si l'utilisateur n'est pas trouvé (P2025)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found in database. Please ensure webhook is working.' }, { status: 404 });
      }
      
      // Erreur de validation (P2002 = unique constraint)
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Bot name already exists or constraint violation.' }, { status: 409 });
      }
    }

    // Erreur spécifique pour les champs inconnus
    if (errorInfo.message.includes('Unknown arg') || errorInfo.message.includes('Unknown argument')) {
      log.error('Prisma schema mismatch detected', { errorMessage: errorInfo.message });
      return NextResponse.json({ 
        error: 'Database schema mismatch. Please contact support.',
        details: 'The database client may need to be regenerated.'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create bot',
      details: errorInfo.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}