import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extraireInfosFacture } from '@/lib/openrouter';
import { getNextFactureNumber, calculerMontants } from '@/lib/facture-utils';
import { creerLienPaiement } from '@/lib/stripe';

// Route pour la transcription audio
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Cas 1: Transcription audio (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audio = formData.get('audio') as Blob;
      
      if (!audio) {
        return NextResponse.json(
          { error: 'Fichier audio requis' },
          { status: 400 }
        );
      }

      // Appeler l'API OpenRouter Whisper pour la transcription
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        // Mode démo sans API
        return NextResponse.json({
          success: true,
          transcription: '[Mode démo] Veuillez configurer OPENROUTER_API_KEY',
          extraction: null,
        });
      }

      // Convertir en base64 pour l'envoi
      const arrayBuffer = await audio.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');

      // Appeler Whisper via OpenRouter
      const whisperResponse = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/whisper-large-v3',
          file: `data:audio/webm;base64,${base64Audio}`,
          language: 'fr',
        }),
      });

      if (!whisperResponse.ok) {
        // Fallback: essayer avec le format FormData
        const formDataWhisper = new FormData();
        formDataWhisper.append('file', audio, 'audio.webm');
        formDataWhisper.append('model', 'openai/whisper-large-v3');
        formDataWhisper.append('language', 'fr');

        const whisperResponse2 = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formDataWhisper,
        });

        if (!whisperResponse2.ok) {
          const errorText = await whisperResponse2.text();
          return NextResponse.json({
            success: false,
            error: `Erreur Whisper: ${errorText}`,
          }, { status: 500 });
        }

        const whisperData = await whisperResponse2.json();
        return NextResponse.json({
          success: true,
          transcription: whisperData.text || '',
        });
      }

      const whisperData = await whisperResponse.json();
      
      return NextResponse.json({
        success: true,
        transcription: whisperData.text || '',
      });
    }

    // Cas 2: Extraction d'informations depuis une transcription (JSON)
    const body = await request.json();
    
    if (body.action === 'extract') {
      const { transcription } = body;
      
      if (!transcription) {
        return NextResponse.json(
          { error: 'Transcription requise' },
          { status: 400 }
        );
      }

      const extraction = await extraireInfosFacture(transcription);
      
      // Si extraction réussie, vérifier si le dossier existe
      if (extraction.success && extraction.numDossier) {
        const client = await prisma.client.findUnique({
          where: { numDossier: extraction.numDossier },
        });

        return NextResponse.json({
          success: true,
          extraction,
          clientTrouve: !!client,
          client: client || null,
        });
      }

      return NextResponse.json({
        success: extraction.success,
        extraction,
        clientTrouve: false,
        client: null,
        error: extraction.error,
      });
    }

    // Cas 3: Création de la facture
    if (body.action === 'create') {
      const { numDossier, montantHT, prestation, genererStripe = true } = body;

      // Validation des données
      if (!numDossier || !montantHT || !prestation) {
        return NextResponse.json(
          { error: 'Données incomplètes: numDossier, montantHT et prestation requis' },
          { status: 400 }
        );
      }

      // Vérifier que le client existe
      const client = await prisma.client.findUnique({
        where: { numDossier: numDossier.toUpperCase().trim() },
      });

      if (!client) {
        return NextResponse.json(
          { error: `Dossier ${numDossier} non trouvé dans la base` },
          { status: 404 }
        );
      }

      // Calculer les montants
      const montants = calculerMontants(Number(montantHT), 20);

      // Obtenir le prochain numéro de facture
      const { numeroSequentiel, prefixe, numeroComplet } = await getNextFactureNumber();

      // Créer le lien Stripe si demandé
      let stripePaymentLink: string | null = null;
      let stripePaymentId: string | null = null;

      if (genererStripe && process.env.STRIPE_SECRET_KEY) {
        const stripeResult = await creerLienPaiement({
          montantTTC: montants.montantTTC,
          numeroFacture: numeroComplet,
          raisonSociale: client.raisonSociale,
          prestation,
        });

        if (stripeResult.success) {
          stripePaymentLink = stripeResult.url || null;
          stripePaymentId = stripeResult.paymentLinkId || null;
        }
      }

      // Créer la facture en base
      const facture = await prisma.facture.create({
        data: {
          numeroSequentiel,
          prefixe,
          numeroComplet,
          prestation,
          montantHT: montants.montantHT,
          tauxTVA: montants.tauxTVA,
          montantTVA: montants.montantTVA,
          montantTTC: montants.montantTTC,
          stripePaymentLink,
          stripePaymentId,
          clientId: client.id,
        },
        include: {
          client: true,
        },
      });

      return NextResponse.json({
        success: true,
        facture,
        message: `Facture ${numeroComplet} créée avec succès`,
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur generate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
