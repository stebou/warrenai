import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { generateBotFromConfig } from '@/lib/trading/agents/bot_creation/agent';
import { BotStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ensureUserExists } from '@/lib/auth/sync-user';
import { 
  validateBotCreationConfig, 
  calculateRiskLevel,
  type ValidatedBotCreationConfig 
} from '@/lib/trading/agents/bot_creation/validation';

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
    const body = await req.json() as any;
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
        description: botSpec.description,
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

    // 5. Retourner une réponse de succès
    return NextResponse.json(newBot, { status: 201 });

  } catch (error) {
    log.error('Failed to create bot', { error });

    // Gestion d'erreur améliorée
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Erreur spécifique si l'utilisateur n'est pas trouvé (P2025)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found in database. Please ensure webhook is working.' }, { status: 404 });
      }
    }

    // Erreur générique pour tous les autres cas
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}